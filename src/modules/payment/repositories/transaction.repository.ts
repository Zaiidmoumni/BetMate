import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionType, TransactionStatus } from '@/modules/payment/transaction.schema'

@Injectable()
export class TransactionRepository {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>
  ) {}

  async create(data: {
    userId: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    paymentMethod: string;
    metadata?: any;
  }): Promise<Transaction> {
    return this.transactionModel.create(data);
  }

  async findById(id: string): Promise<Transaction> {
    return this.transactionModel.findById(id);
  }

  async findByReference(reference: string): Promise<Transaction> {
    return this.transactionModel.findOne({ reference });
  }

  async updateStatus(
    id: string, 
    status: TransactionStatus, 
    failureReason?: string
  ): Promise<Transaction> {
    const update: any = { status };
    if (failureReason) {
      update.failureReason = failureReason;
    }
    return this.transactionModel.findByIdAndUpdate(id, update, { new: true });
  }

  async updateReference(id: string, reference: string): Promise<Transaction> {
    return this.transactionModel.findByIdAndUpdate(
      id,
      { reference },
      { new: true }
    );
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }
  
  async getPendingWithdrawals(): Promise<Transaction[]> {
    return this.transactionModel
      .find({
        type: 'withdrawal',
        status: { $in: [TransactionStatus.INITIATED, TransactionStatus.PENDING, TransactionStatus.PROCESSING] }
      })
      .sort({ createdAt: 1 })
      .exec();
  }
}
