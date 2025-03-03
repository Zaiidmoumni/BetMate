import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
}

export enum TransactionStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed', 
  FAILED = 'failed', 
  CANCELLED = 'cancelled', 
  EXPIRED = 'expired', 
  REFUNDED = 'refunded', 
  ON_HOLD = 'on_hold', 
  REJECTED = 'rejected', 
}

export type DepositResponse = {
  transactionId: string;
  checkoutUrl: string;
  status: TransactionStatus;
};

export interface WithdrawalResponse {
  transactionId: string;
  status: TransactionStatus;
  estimatedCompletionTime: string;
}

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({
    required: true,
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop()
  reference?: string;

  @Prop()
  failureReason?: string;

  @Prop()
  providerTransactionId?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
