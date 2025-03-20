import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Request,
  Res,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './services/payment.service';
import { AccessTokenGuard } from '@/guards/accessToken.guard';
import { Response } from 'express';
import { WithdrawalDto } from './dto/withdrawal.dto';
import { AdminGuard } from '@/guards/admin.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('deposit')
  @UseGuards(AccessTokenGuard)
  async initiateDeposit(
    @Body() depositData: { amount: number; paymentMethod: string },
    @Request() req,
  ) {
    if (!depositData.amount || !depositData.paymentMethod) {
      throw new BadRequestException('Amount and payment method are required!');
    }

    const userId = req.user.userId;

    return this.paymentService.initiateDeposit(
      userId,
      depositData.amount,
      depositData.paymentMethod,
    );
  }

  @Post('webhook')
  async handlePaymentWebhook(@Body() webhookData: any, @Res() res: Response) {
    await this.paymentService.handlePaymentWebhook(webhookData);
    return res.status(200).send();
  }

  @Post('withdraw')
  @UseGuards(AccessTokenGuard)
  async initiateWithdrawal(
    @Body() withdrawalData: WithdrawalDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.paymentService.initiateWithdrawal(userId, withdrawalData);
  }

  @Post('withdraw/cancel/:id')
  @UseGuards(AccessTokenGuard)
  async cancelWithdrawal(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return this.paymentService.cancelWithdrawal(id, userId);
  }

  // Admin endpoint to process withdrawals
  @Post('withdraw/process/:id')
  @UseGuards(AccessTokenGuard, AdminGuard)
  async processWithdrawal(@Param('id') id: string) {
    return this.paymentService.processWithdrawal(id);
  }

  @Get('transaction/:id')
  @UseGuards(AccessTokenGuard)
  async getTransaction(@Param('id') id: string, @Request() req) {
    const transaction = await this.paymentService.getTransaction(id);

    // Ensure users can only access their own transactions
    if (transaction.userId.toString() !== req.user.userId) {
      throw new BadRequestException('Unauthorized access to transaction');
    }

    return transaction;
  }

  @Get('history')
  @UseGuards(AccessTokenGuard)
  async getUserTransactions(@Request() req) {
    const userId = req.user.userId;
    return this.paymentService.getUserTransactions(userId);
  }

  @Get('all')
  @UseGuards(AccessTokenGuard, AdminGuard) 
  async getAllTransactions() {
    return this.paymentService.getAllTransactions();
  }

  @Get('balance')
  @UseGuards(AccessTokenGuard)
  async getUserBalance(@Request() req) {
    const userId = req.user.userId;
    return { balance: await this.paymentService.getUserBalance(userId) };
  }
}
