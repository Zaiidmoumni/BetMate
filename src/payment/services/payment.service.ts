import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transaction.schema';
import { Model } from 'mongoose';
import { User } from '@/modules/users/schemas/user.schema';
import { MollieService, PaymentData } from './mollie.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    @InjectModel(User.name) private userModel: Model<User>,
    private mollieService: MollieService,
  ) {}

  // Initialize a deposit transaction
  async initiateDeposit(userId: string, amount: number, paymentMethod: string) {
    // Validate the amount
    if (amount < 10 || amount > 10000) {
      throw new BadRequestException('Amount must be between 10 and 10000');
    }

    // Create a new transaction record
    const transaction = await this.transactionModel.create({
      userId,
      amount,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.INITIATED,
      paymentMethod,
    });

    try {
      // Initialize the payment with Mollie
      const paymentData: PaymentData = {
        amount,
        currency: 'EUR',
        description: `Deposit to betting account - ${transaction._id}`,
        transactionId: transaction._id.toString(),
      };
      const payment = await this.mollieService.createPayment(paymentData);
      // Update the transaction with the provider transaction ID
      transaction.status = TransactionStatus.PENDING;
      transaction.reference = payment.paymentId;
      await transaction.save();

      // Return the payment URL to the user
      return {
        transactionId: transaction._id,
        checkoutUrl: payment.paymentUrl,
        status: transaction.status,
      };
    } catch (error) {
      // Handle payment initialization failure
      transaction.status = TransactionStatus.FAILED;
      transaction.failureReason = error.message;
      await transaction.save();
      throw new BadRequestException('Payment initialization failed');
    }
  }
}
