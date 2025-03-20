import { Injectable, Logger } from '@nestjs/common';
import {
  createMollieClient,
  Payment as MolliePayment,
} from '@mollie/api-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MollieService {
  private readonly client;
  private readonly logger = new Logger(MollieService.name);

  constructor(private configService: ConfigService) {
    this.client = createMollieClient({
      apiKey: this.configService.get<string>('MOLLIE_API_KEY'),
    });
  }

  async createPayment(params: {
    amount: number;
    paymentMethod: string;
    description: string;
    metadata: any;
  }): Promise<MolliePayment> {
    try {
      return await this.client.payments.create({
        amount: {
          currency: 'EUR',
          value: params.amount.toFixed(2),
        },
        method: params.paymentMethod,
        description: params.description,
        redirectUrl: `${this.configService.get('APP_URL')}/payment/return`,
        webhookUrl: `${this.configService.get('APP_URL')}/payment/webhook`,
        metadata: params.metadata,
      });
    } catch (error) {
      this.logger.error('Failed to create Mollie payment:', error);
      throw error;
    }
  }

  async getPayment(paymentId: string): Promise<MolliePayment> {
    try {
      return await this.client.payments.get(paymentId);
    } catch (error) {
      this.logger.error(`Failed to get payment ${paymentId}:`, error);
      throw error;
    }
  }

  async createPayout(payoutData: {
    amount: number;
    bankAccount: {
      holderName: string;
      iban: string;
      bic?: string;
    };
    description: string;
  }): Promise<any> {
    const { amount, bankAccount, description } = payoutData;

    if (this.configService.get('NODE_ENV') === 'production') {
      throw new Error('Production payouts not implemented');
    } else {
      return {
        id: `tr_payout_${Date.now()}`,
        amount: {
          value: amount.toFixed(2),
          currency: 'EUR'
        },
        description,
        status: 'pending',
        _links: {
          self: {
            href: `https://api.mollie.com/v2/payments/tr_payout_${Date.now()}`
          }
        },
        createdAt: new Date().toISOString()
      };
    }
  }
  
}
