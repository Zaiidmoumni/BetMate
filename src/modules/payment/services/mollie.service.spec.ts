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

  describe('createPayout', () => {
    it('should throw error in production environment', async () => {
      const payoutData = {
        amount: 100,
        bankAccount: {
          holderName: 'John Doe',
          iban: 'NL02ABNA0123456789',
          bic: 'ABNANL2A',
        },
        description: 'Test payout',
      };

      // Mock production environment
      configService.get.mockImplementation((key) => {
        if (key === 'NODE_ENV') return 'production';
        return undefined;
      });

      await expect(service.createPayout(payoutData)).rejects.toThrow('Production payouts not implemented');
    });

    it('should create a mock payout in non-production environment', async () => {
      const payoutData = {
        amount: 100,
        bankAccount: {
          holderName: 'John Doe',
          iban: 'NL02ABNA0123456789',
          bic: 'ABNANL2A',
        },
        description: 'Test payout',
      };

      // Mock non-production environment
      configService.get.mockImplementation((key) => {
        if (key === 'NODE_ENV') return 'development';
        return undefined;
      });

      const result = await service.createPayout(payoutData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('amount');
      expect(result.amount).toEqual({
        value: '100.00',
        currency: 'EUR',
      });
      expect(result).toHaveProperty('description', 'Test payout');
      expect(result).toHaveProperty('status', 'pending');
      expect(result).toHaveProperty('_links');
      expect(result).toHaveProperty('createdAt');
    });

    it('should include correct transaction ID format in mock payout', async () => {
      const payoutData = {
        amount: 100,
        bankAccount: {
          holderName: 'John Doe',
          iban: 'NL02ABNA0123456789',
        },
        description: 'Test payout',
      };

      // Mock non-production environment
      configService.get.mockImplementation((key) => {
        if (key === 'NODE_ENV') return 'development';
        return undefined;
      });

      // Mock Date.now to return a consistent value for testing
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

      const result = await service.createPayout(payoutData);

      expect(result.id).toBe('tr_payout_1234567890');
      expect(result._links.self.href).toBe('https://api.mollie.com/v2/payments/tr_payout_1234567890');

      // Restore the original Date.now implementation
      dateSpy.mockRestore();
    });
  });
});