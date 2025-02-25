import { Test, TestingModule } from '@nestjs/testing';
import { MollieService } from '../services/mollie.service';
import { ConfigService } from '@nestjs/config';
import { createMollieClient } from '@mollie/api-client';

jest.mock('@mollie/api-client', () => {
  return {
    createMollieClient: jest.fn().mockReturnValue({
      payments: {
        create: jest.fn(),
        get: jest.fn(),
      },
    }),
  };
});

describe('MollieService', () => {
  let service: MollieService;
  let configService: jest.Mocked<ConfigService>;
  let mockMollieClient;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    mockMollieClient = {
      payments: {
        create: jest.fn(),
        get: jest.fn(),
      },
    };

    (createMollieClient as jest.Mock).mockReturnValue(mockMollieClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MollieService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MollieService>(MollieService);
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  describe('initialization', () => {
    it('should create a mollie client with the API key from config', () => {
      // The API key is fetched in the constructor
      expect(configService.get).toHaveBeenCalledWith('MOLLIE_API_KEY');
      expect(createMollieClient).toHaveBeenCalled();
    });
  });

  describe('createPayment', () => {
    it('should create a payment successfully', async () => {
      const paymentParams = {
        amount: 100,
        paymentMethod: 'ideal',
        description: 'Test payment',
        metadata: { transactionId: '123' },
      };

      const expectedMolliePayment = {
        id: 'tr_123',
        status: 'open',
      };

      configService.get.mockImplementation((key) => {
        if (key === 'APP_URL') return 'https://myapp.com';
        return undefined;
      });

      mockMollieClient.payments.create.mockResolvedValue(expectedMolliePayment);

      const result = await service.createPayment(paymentParams);

      expect(mockMollieClient.payments.create).toHaveBeenCalledWith({
        amount: {
          currency: 'EUR',
          value: '100.00',
        },
        method: 'ideal',
        description: 'Test payment',
        redirectUrl: 'https://myapp.com/payment/return',
        webhookUrl: 'https://myapp.com/payment/webhook',
        metadata: { transactionId: '123' },
      });

      expect(result).toEqual(expectedMolliePayment);
    });

    it('should throw error when payment creation fails', async () => {
      const paymentParams = {
        amount: 100,
        paymentMethod: 'ideal',
        description: 'Test payment',
        metadata: { transactionId: '123' },
      };

      const error = new Error('Payment creation failed');
      mockMollieClient.payments.create.mockRejectedValue(error);

      await expect(service.createPayment(paymentParams)).rejects.toThrow(error);
    });
  });

  describe('getPayment', () => {
    it('should get a payment successfully', async () => {
      const paymentId = 'tr_123';
      const expectedPayment = {
        id: paymentId,
        status: 'paid',
      };

      mockMollieClient.payments.get.mockResolvedValue(expectedPayment);

      const result = await service.getPayment(paymentId);

      expect(mockMollieClient.payments.get).toHaveBeenCalledWith(paymentId);
      expect(result).toEqual(expectedPayment);
    });

    it('should throw error when getting payment fails', async () => {
      const paymentId = 'tr_123';
      const error = new Error('Payment not found');

      mockMollieClient.payments.get.mockRejectedValue(error);

      await expect(service.getPayment(paymentId)).rejects.toThrow(error);
    });
  });
});