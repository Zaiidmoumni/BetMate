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

  @Post('withdraw')
  @UseGuards(AccessTokenGuard)
  async initiateWithdrawal(@Request() req, @Body() withdrawalDto: WithdrawalDto) {
    return this.paymentService.initiateWithdrawal(
      req.user.userId,
      withdrawalDto.amount,
      withdrawalDto.bankAccount
    );
  }

  @Post('webhook')
  async handlePaymentWebhook(@Body() webhookData: any, @Res() res: Response) {
    await this.paymentService.handlePaymentWebhook(webhookData);
    return res.status(200).send();
  }

  @Post('withdrawal-webhook')
  async handleWithdrawalWebhook(@Body() webhookData: any) {
    return this.paymentService.handleWithdrawalWebhook(webhookData);
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

  @Get('transactions')
  @UseGuards(AccessTokenGuard)
  async getUserTransactions(@Request() req) {
    const userId = req.user.userId;
    return this.paymentService.getUserTransactions(userId);
  }

  @Get('balance')
  @UseGuards(AccessTokenGuard)
  async getUserBalance(@Request() req) {
    const userId = req.user.userId;
    return { balance: await this.paymentService.getUserBalance(userId) };
  }
}