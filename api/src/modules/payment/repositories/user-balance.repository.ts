import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '@/modules/users/schemas/user.schema';

@Injectable()
export class UserBalanceRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async incrementBalance(userId: string, amount: number): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount } },
      { new: true }
    );
  }

  async decrementBalance(userId: string, amount: number): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { balance: -amount } },
      { new: true }
    );
  }

  async getUserBalance(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId);
    return user?.balance || 0;
  }

  async checkSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    return user?.balance >= amount;
  }

  async getUserBankAccount(userId: string):Promise<string> {
    const user = await this.userModel.findById(userId);
    return user?.bankAccount 
  }

  async setBankAccount(userId:string):Promise<void> {

  }
}