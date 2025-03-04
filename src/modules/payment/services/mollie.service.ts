import { Injectable, Logger } from '@nestjs/common';
import { createMollieClient, Payment as MolliePayment } from '@mollie/api-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MollieService {
  private readonly client;
  private readonly logger = new Logger(MollieService.name);

  constructor(private configService: ConfigService) {
    this.client = createMollieClient({
      apiKey: this.configService.get<string>('MOLLIE_API_KEY')
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
          value: params.amount.toFixed(2)
        },
        method: params.paymentMethod,
        description: params.description,
        redirectUrl: `${this.configService.get('APP_URL')}/payment/return`,
        webhookUrl: `${this.configService.get('APP_URL')}/payment/webhook`,
        metadata: params.metadata
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

  async createPayout(params: {
    amount: number;
    bankAccount: string;
    description: string;
    metadata: any;
  }): Promise<any> {
    try {
      // Store bank account info in metadata for manual processing
      const metadata = {
        ...params.metadata,
        bankAccount: params.bankAccount,
        isWithdrawal: true
      };

      // Create a payment with banktransfer method
      // This will be handled as a withdrawal internally by your system
      const payment = await this.client.payments.create({
        amount: {
          currency: 'EUR',
          value: params.amount.toFixed(2)
        },
        method: 'banktransfer',
        description: params.description,
        metadata: metadata,
        redirectUrl: `${this.configService.get('APP_URL')}/payment/return`,
        webhookUrl: `${this.configService.get('APP_URL')}/payment/withdrawal-webhook`
      });
      
      return payment;
    } catch (error) {
      this.logger.error('Failed to create withdrawal:', error);
      throw error;
    }
  }
  async getPayout(payoutId: string): Promise<any> {
    try {
      return await this.client.payments.get(payoutId);
    } catch (error) {
      this.logger.error(`Failed to get payout ${payoutId}:`, error);
      throw error;
    }
  }
}