import createMollieClient from '@mollie/api-client';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PaymentData {
  amount: number;
  currency: string;
  description: string;
  transactionId: string;
}

@Injectable()
export class MollieService implements OnModuleInit {
  private mollieClient: any;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('mollie.apiKey');
    if (!apiKey) {
      throw new Error('Mollie API key is not configured!');
    }

    this.mollieClient = createMollieClient({ apiKey });
  }

  async getAvailablePaymentMethods() {
    try {
      const methods = await this.mollieClient.methods.list();
      return methods.map((method) => ({
        id: method.id,
        name: method.description,
        image: method.image.size2x,
        minAmount: method.minimumAmount,
        maxAmount: method.maximumAmount,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch payment methods: ${error.message}`);
    }
  }

  async createPayment(paymentData: PaymentData) {
    try {
        const payment = await this.mollieClient.create({
            amount: {
                value: paymentData.amount.toFixed(2),
                currency: paymentData.currency,
            },
            description: paymentData.description,
            redirectUrl: `${this.configService.get('mollie.redirectUrl')}/${paymentData.transactionId}`,
        webhookUrl: `${this.configService.get('mollie.webhookUrl')}/payment/webhook`,
        })
        return {
            paymentId: payment.id,
            paymentUrl: payment.getPaymentUrl(),
            status: payment.status
        }
    } catch (error) {
        throw new Error(`Failed to create payment: ${error.message}`);
    }
  }
}
