import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuthRepository {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email });
  }

  async create(user: Partial<User>): Promise<User> {
    const newUser = new this.userModel(user);
    return newUser.save();
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword
    });
  }
  
  async markEmailAsVerified(email: string): Promise<User | null> {
    return this.userModel.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true },
    );
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }
}
