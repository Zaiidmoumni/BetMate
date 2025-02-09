import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  TransactionStatus,
  TransactionType,
  DepositResponse,
} from '../transaction.schema';
import { MollieService, PaymentData } from './mollie.service';
import { TransactionRepository } from '../repositories/transaction.repository';
import { UserBalanceRepository } from '../repositories/user-balance.repository';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  constructor(
    private transactionRepository: TransactionRepository, 
    private userBalanceRepository: UserBalanceRepository,
    private mollieService: MollieService,
    private configService: ConfigService,
  ) {}

  // Initialize a deposit transaction
  async initiateDeposit(
    userId: string,
    amount: number,
    paymentMethod: string,
  ): Promise<DepositResponse> {
    // Validate amount
    this.validateDepositAmount(amount);

    // Create initial transaction
    const transaction = await this.transactionRepository.create({
      userId,
      amount,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.INITIATED,
      paymentMethod,
    });

    try {
      // Create Mollie payment
      const payment = await this.mollieService.createPayment({
        amount,
        currency: 'EUR',
        description: `Deposit to account - ${transaction._id}`,
        transactionId: transaction._id.toString(),
      });

      // Update transaction with payment reference
      await this.transactionRepository.updateReference(
        transaction._id.toString(),
        payment.paymentId,
      );
      await this.transactionRepository.updateStatus(
        transaction._id.toString(),
        TransactionStatus.PENDING,
      );

      return {
        transactionId: transaction._id.toString(),
        checkoutUrl: payment.paymentUrl,
        status: transaction.status as TransactionStatus,
      };
    } catch (error) {
      await this.transactionRepository.updateStatus(
        transaction._id.toString(),
        TransactionStatus.FAILED,
        error.message,
      );
      throw new BadRequestException('Failed to initialize payment');
    }
  }

  // Handle Mollie webhook
  async handlePaymentWebhook(webhookData: any) {
    const { id: molliePaymentId } = webhookData;

    try {
      const molliePayment = await this.mollieService.getPayment(molliePaymentId);
      const transaction = await this.transactionRepository.findByReference(
        molliePaymentId,
      );

      if (!transaction) {
        throw new BadRequestException('Transaction not found');
      }
      const newStatus = this.mapMollieStatus(molliePayment.status);
      
      if (newStatus === TransactionStatus.COMPLETED && 
          transaction.status !== TransactionStatus.COMPLETED) {
        await this.userBalanceRepository.incrementBalance(
          transaction.userId,
          transaction.amount
        );
      }

      await this.transactionRepository.updateStatus(
        transaction._id.toString(),
        newStatus,
        newStatus === TransactionStatus.FAILED ? `Payment ${molliePayment.status}` : undefined
      );

      return { processed: true };
    } catch (error) {
      this.logger.error('Webhook processing error:', error);
      throw error;
    }
  }
  /* 
  ** Helper functions
  */

  private validateDepositAmount(amount: number) {
    const minAmount = this.configService.get<number>('MIN_DEPOSIT_AMOUNT', 10);
    const maxAmount = this.configService.get<number>('MAX_DEPOSIT_AMOUNT', 10000);

    if (amount < minAmount || amount > maxAmount) {
      throw new BadRequestException(
        `Deposit amount must be between ${minAmount} and ${maxAmount}`
      );
    }
  }

  private mapMollieStatus(mollieStatus: string): TransactionStatus {
    const statusMap = {
      paid: TransactionStatus.COMPLETED,
      failed: TransactionStatus.FAILED,
      canceled: TransactionStatus.CANCELLED,
      expired: TransactionStatus.EXPIRED,
      pending: TransactionStatus.PENDING,
      open: TransactionStatus.PROCESSING
    };

    return statusMap[mollieStatus] || TransactionStatus.PROCESSING;
  }


}
