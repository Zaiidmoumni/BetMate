import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './services/payment.service';
import { AccessTokenGuard } from '@/guards/accessToken.guard';
import { Response } from 'express';

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
      throw new BadRequestException(
        'Amount and payment method are reqauired !',
      );
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
}
