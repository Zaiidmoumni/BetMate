import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionRepository } from '../repositories/transaction.repository';
import { UserBalanceRepository } from '../repositories/user-balance.repository';
import { MollieService } from './mollie.service';
import { ConfigService } from '@nestjs/config';
import { DepositResponse, Transaction, TransactionStatus, TransactionType } from '../transaction.schema';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private transactionRepository: TransactionRepository,
    private userBalanceRepository: UserBalanceRepository,
    private mollieService: MollieService,
    private configService: ConfigService
  ) {}

  async initiateDeposit(
    userId: string,
    amount: number,
    paymentMethod: string
  ): Promise<DepositResponse> {
    // Validate amount
    this.validateDepositAmount(amount);

    // Create initial transaction
    const transaction = await this.transactionRepository.create({
      userId,
      amount,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.INITIATED,
      paymentMethod
    });

    try {
      // Create Mollie payment
      const payment = await this.mollieService.createPayment({
        amount,
        paymentMethod,
        description: `Deposit to account - ${transaction._id}`,
        metadata: { transactionId: transaction._id }
      });

      const transactionId = transaction._id.toString()

      // Update transaction with payment reference
      await this.transactionRepository.updateReference(transactionId, payment.id);
      await this.transactionRepository.updateStatus(transactionId, TransactionStatus.PENDING);

      return {
        transactionId: transactionId,
        checkoutUrl: payment._links.checkout.href,
        status: TransactionStatus.PENDING
      };
    } catch (error) {
      await this.transactionRepository.updateStatus(
        transaction._id.toString(),
        TransactionStatus.FAILED,
        error.message
      );
      throw new BadRequestException('Failed to initialize payment');
    }
  }

  async handlePaymentWebhook(webhookData: any) {
    const { id: molliePaymentId } = webhookData;
    
    try {
      const molliePayment = await this.mollieService.getPayment(molliePaymentId);
      const transaction = await this.transactionRepository.findByReference(molliePaymentId);

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
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

  // Query methods
  async getTransaction(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.getUserTransactions(userId);
  }

  async getUserBalance(userId: string): Promise<number> {
    return this.userBalanceRepository.getUserBalance(userId);
  }
}