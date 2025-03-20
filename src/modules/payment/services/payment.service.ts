import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionRepository } from '../repositories/transaction.repository';
import { UserBalanceRepository } from '../repositories/user-balance.repository';
import { MollieService } from './mollie.service';
import { ConfigService } from '@nestjs/config';
import { DepositResponse, Transaction, TransactionStatus, TransactionType, WithdrawalResponse } from '../transaction.schema';
import { WithdrawalDto } from '../dto/withdrawal.dto';

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
  
  async initiateWithdrawal(
    userId: string,
    withdrawalData: WithdrawalDto
  ): Promise<WithdrawalResponse> {
    const { amount, bankName, accountHolder, iban, bic, description } = withdrawalData;
    
    // Validate withdrawal amount
    this.validateWithdrawalAmount(amount);
    
    // Check user balance
    const userBalance = await this.userBalanceRepository.getUserBalance(userId);
    if (userBalance < amount) {
      throw new BadRequestException('Insufficient balance for withdrawal');
    }
    
    // Create withdrawal transaction
    const transaction = await this.transactionRepository.create({
      userId,
      amount,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.INITIATED,
      paymentMethod: 'bank_transfer',
      metadata: {
        bankName,
        accountHolder,
        iban,
        bic,
        description: description || `Withdrawal of ${amount}`
      }
    });
    
    try {
      // Deduct from user balance immediately to prevent overdrafts
      await this.userBalanceRepository.decrementBalance(userId, amount);
      
      // Set status to pending for admin review
      await this.transactionRepository.updateStatus(
        transaction._id.toString(),
        TransactionStatus.PENDING
      );
      
      return {
        transactionId: transaction._id.toString(),
        status: TransactionStatus.PENDING,
        estimatedCompletionTime: this.getEstimatedCompletionTime()
      };
    } catch (error) {
      // If balance update fails, mark transaction as failed
      await this.transactionRepository.updateStatus(
        transaction._id.toString(),
        TransactionStatus.FAILED,
        error.message
      );
      throw new BadRequestException('Failed to process withdrawal');
    }
  }

  async processWithdrawal(transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(transactionId);
    
    if (!transaction) {
      throw new NotFoundException('Withdrawal transaction not found');
    }
    
    if (transaction.type !== TransactionType.WITHDRAWAL) {
      throw new BadRequestException('Transaction is not a withdrawal');
    }
    
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(`Cannot process withdrawal in ${transaction.status} status`);
    }
    
    // Update status to processing
    await this.transactionRepository.updateStatus(
      transactionId,
      TransactionStatus.PROCESSING
    );
    
    try {
      const { bankName, accountHolder, iban, bic, description } = transaction.metadata || {};
      
      const payout = await this.mollieService.createPayout({
        amount: transaction.amount,
        bankAccount: {
          holderName: accountHolder,
          iban,
          bic
        },
        description: description || `Withdrawal for user ${transaction.userId}`
      });
      
      // Update transaction with payout reference
      await this.transactionRepository.updateReference(transactionId, payout.id);
      
      await this.transactionRepository.updateStatus(
        transactionId,
        TransactionStatus.COMPLETED
      );
      
      return this.transactionRepository.findById(transactionId);
    } catch (error) {
      // If payout fails, revert transaction status and refund balance
      await this.transactionRepository.updateStatus(
        transactionId,
        TransactionStatus.FAILED,
        error.message
      );
      
      // Return amount to user balance
      await this.userBalanceRepository.incrementBalance(
        transaction.userId,
        transaction.amount
      );
      
      throw new BadRequestException(`Failed to process withdrawal: ${error.message}`);
    }
  }
  
  async cancelWithdrawal(transactionId: string, userId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(transactionId);
    
    if (!transaction) {
      throw new NotFoundException('Withdrawal transaction not found');
    }
    
    if (transaction.userId.toString() !== userId) {
      throw new BadRequestException('Unauthorized access to transaction');
    }
    
    if (transaction.type !== TransactionType.WITHDRAWAL) {
      throw new BadRequestException('Transaction is not a withdrawal');
    }
    
    if (![TransactionStatus.INITIATED, TransactionStatus.PENDING].includes(transaction.status)) {
      throw new BadRequestException('Withdrawal can only be canceled when in initiated or pending status');
    }
    
    // Update status to cancelled
    await this.transactionRepository.updateStatus(
      transactionId,
      TransactionStatus.CANCELLED
    );
    
    // Return amount to user balance
    await this.userBalanceRepository.incrementBalance(
      transaction.userId,
      transaction.amount
    );
    
    return this.transactionRepository.findById(transactionId);
  }

  /**
   * Helper methods
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
  private validateWithdrawalAmount(amount: number) {
    const minAmount = this.configService.get<number>('MIN_WITHDRAWAL_AMOUNT', 10);
    const maxAmount = this.configService.get<number>('MAX_WITHDRAWAL_AMOUNT', 10000);

    if (amount < minAmount || amount > maxAmount) {
      throw new BadRequestException(
        `Withdrawal amount must be between ${minAmount} and ${maxAmount}`
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

  private getEstimatedCompletionTime(): string {
    // Return estimated time (e.g., 1-2 business days)
    const businessDays = this.configService.get<number>('WITHDRAWAL_PROCESSING_DAYS', 2);
    return `${businessDays} business day${businessDays > 1 ? 's' : ''}`;
  }
  
  /**
   * Query Methods
   */
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

  async getPendingTransactions(): Promise<Transaction[]> {
    return this.transactionRepository.getPendingWithdrawals();
  }
  async getUserBalance(userId: string): Promise<number> {
    return this.userBalanceRepository.getUserBalance(userId);
  }
}