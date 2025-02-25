import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from '../services/payment.service';
import { TransactionRepository } from '../repositories/transaction.repository';
import { UserBalanceRepository } from '../repositories/user-balance.repository';
import { MollieService } from '../services/mollie.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DepositResponse, Transaction, TransactionStatus, TransactionType } from '../transaction.schema';
import { Types } from 'mongoose';
import { Payment } from '@mollie/api-client';

// Create a partial type for mocking Mongoose documents
type PartialMockedTransaction = Partial<Transaction> & {
  _id: Types.ObjectId;
};

// Create a partial type for mocking Mollie Payment objects
type PartialMockedMolliePayment = Partial<Payment> & {
  id: string;
};

describe('PaymentService', () => {
  let service: PaymentService;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let userBalanceRepository: jest.Mocked<UserBalanceRepository>;
  let mollieService: jest.Mocked<MollieService>;
  let configService: jest.Mocked<ConfigService>;

  const mockObjectId = new Types.ObjectId();
  const mockTransactionId = mockObjectId.toString();

  beforeEach(async () => {
    const mockTransactionRepository = {
      create: jest.fn(),
      updateReference: jest.fn(),
      updateStatus: jest.fn(),
      findByReference: jest.fn(),
      findById: jest.fn(),
      getUserTransactions: jest.fn(),
    };

    const mockUserBalanceRepository = {
      incrementBalance: jest.fn(),
      getUserBalance: jest.fn(),
    };

    const mockMollieService = {
      createPayment: jest.fn(),
      getPayment: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: TransactionRepository, useValue: mockTransactionRepository },
        { provide: UserBalanceRepository, useValue: mockUserBalanceRepository },
        { provide: MollieService, useValue: mockMollieService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    transactionRepository = module.get(TransactionRepository) as jest.Mocked<TransactionRepository>;
    userBalanceRepository = module.get(UserBalanceRepository) as jest.Mocked<UserBalanceRepository>;
    mollieService = module.get(MollieService) as jest.Mocked<MollieService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  describe('initiateDeposit', () => {
    const userId = 'user123';
    const amount = 100;
    const paymentMethod = 'ideal';

    beforeEach(() => {
      configService.get.mockImplementation((key, defaultValue) => {
        if (key === 'MIN_DEPOSIT_AMOUNT') return 10;
        if (key === 'MAX_DEPOSIT_AMOUNT') return 10000;
        return defaultValue;
      });
    });

    it('should create a transaction and mollie payment successfully', async () => {
      // Create a partial Transaction that matches the expected structure
      const mockTransaction = {
        _id: mockObjectId,
        userId,
        amount,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.INITIATED,
        paymentMethod,
      } as PartialMockedTransaction;

      // Create a partial Mollie Payment that matches the expected structure
      const mockMolliePayment = {
        id: 'mollie_123',
        status: 'open',
        amount: {
          currency: 'EUR',
          value: '100.00',
        },
        method: paymentMethod,
        description: 'Test payment',
        metadata: { transactionId: mockObjectId },
        createdAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        mode: 'test',
        isCancelable: true,
        resource: 'payment',
        sequenceType: 'oneoff',
        redirectUrl: 'https://example.com/redirect',
        webhookUrl: 'https://example.com/webhook',
        profileId: 'profile_123',
        settlementId: 'settlement_123',
        locale: 'en_US',
        _links: {
          checkout: {
            href: 'https://checkout.mollie.com/123',
            type: 'text/html',
          },
          self: {
            href: 'https://api.mollie.com/v2/payments/tr_123',
            type: 'application/hal+json',
          },
        },
      } as unknown as Payment;

      transactionRepository.create.mockResolvedValue(mockTransaction as unknown as Transaction);
      mollieService.createPayment.mockResolvedValue(mockMolliePayment);
      transactionRepository.updateReference.mockResolvedValue(undefined);
      transactionRepository.updateStatus.mockResolvedValue(undefined);

      const result = await service.initiateDeposit(userId, amount, paymentMethod);

      expect(transactionRepository.create).toHaveBeenCalledWith({
        userId,
        amount,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.INITIATED,
        paymentMethod,
      });

      expect(mollieService.createPayment).toHaveBeenCalledWith({
        amount,
        paymentMethod,
        description: `Deposit to account - ${mockObjectId}`,
        metadata: { transactionId: mockObjectId },
      });

      expect(transactionRepository.updateReference).toHaveBeenCalledWith(
        mockTransactionId,
        'mollie_123',
      );

      expect(transactionRepository.updateStatus).toHaveBeenCalledWith(
        mockTransactionId,
        TransactionStatus.PENDING,
      );

      expect(result).toEqual({
        transactionId: mockTransactionId,
        checkoutUrl: 'https://checkout.mollie.com/123',
        status: TransactionStatus.PENDING,
      } as DepositResponse);
    });

    it('should throw BadRequestException when amount is less than minimum', async () => {
      await expect(service.initiateDeposit(userId, 5, paymentMethod)).rejects.toThrow(
        BadRequestException,
      );
      expect(transactionRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when amount is more than maximum', async () => {
      await expect(service.initiateDeposit(userId, 20000, paymentMethod)).rejects.toThrow(
        BadRequestException,
      );
      expect(transactionRepository.create).not.toHaveBeenCalled();
    });

    it('should mark transaction as failed when mollie payment creation fails', async () => {
      const mockTransaction = {
        _id: mockObjectId,
        userId,
        amount,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.INITIATED,
        paymentMethod,
      } as PartialMockedTransaction;

      transactionRepository.create.mockResolvedValue(mockTransaction as unknown as Transaction);
      mollieService.createPayment.mockRejectedValue(new Error('Mollie error'));

      await expect(service.initiateDeposit(userId, amount, paymentMethod)).rejects.toThrow(
        BadRequestException,
      );

      expect(transactionRepository.updateStatus).toHaveBeenCalledWith(
        mockTransactionId,
        TransactionStatus.FAILED,
        'Mollie error',
      );
    });
  });

  describe('handlePaymentWebhook', () => {
    const molliePaymentId = 'mollie_123';
    const userId = 'user123';
    const amount = 100;

    it('should process a successful payment and update user balance', async () => {
      const mockMolliePayment = {
        id: molliePaymentId,
        status: 'paid',
        amount: {
          currency: 'EUR',
          value: '100.00',
        },
        method: 'ideal',
        description: 'Test payment',
        createdAt: new Date().toISOString(),
        mode: 'test',
        resource: 'payment',
        profileId: 'profile_123',
        _links: {
          self: {
            href: 'https://api.mollie.com/v2/payments/tr_123',
            type: 'application/hal+json',
          },
        },
      } as unknown as Payment;

      const mockTransaction = {
        _id: mockObjectId,
        userId,
        amount,
        status: TransactionStatus.PENDING,
        type: TransactionType.DEPOSIT,
        paymentMethod: 'ideal',
      } as PartialMockedTransaction;

      mollieService.getPayment.mockResolvedValue(mockMolliePayment);
      transactionRepository.findByReference.mockResolvedValue(mockTransaction as unknown as Transaction);
      userBalanceRepository.incrementBalance.mockResolvedValue(undefined);
      transactionRepository.updateStatus.mockResolvedValue(undefined);

      const result = await service.handlePaymentWebhook({ id: molliePaymentId });

      expect(mollieService.getPayment).toHaveBeenCalledWith(molliePaymentId);
      expect(transactionRepository.findByReference).toHaveBeenCalledWith(molliePaymentId);
      expect(userBalanceRepository.incrementBalance).toHaveBeenCalledWith(userId, amount);
      expect(transactionRepository.updateStatus).toHaveBeenCalledWith(
        mockTransactionId,
        TransactionStatus.COMPLETED,
        undefined,
      );
      expect(result).toEqual({ processed: true });
    });

    it('should not increment balance if payment is already completed', async () => {
      const mockMolliePayment = {
        id: molliePaymentId,
        status: 'paid',
        amount: {
          currency: 'EUR',
          value: '100.00',
        },
        method: 'ideal',
        description: 'Test payment',
        createdAt: new Date().toISOString(),
        mode: 'test',
        resource: 'payment',
        profileId: 'profile_123',
        _links: {
          self: {
            href: 'https://api.mollie.com/v2/payments/tr_123',
            type: 'application/hal+json',
          },
        },
      } as unknown as Payment;

      const mockTransaction = {
        _id: mockObjectId,
        userId,
        amount,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.DEPOSIT,
        paymentMethod: 'ideal',
      } as PartialMockedTransaction;

      mollieService.getPayment.mockResolvedValue(mockMolliePayment);
      transactionRepository.findByReference.mockResolvedValue(mockTransaction as unknown as Transaction);

      await service.handlePaymentWebhook({ id: molliePaymentId });

      expect(userBalanceRepository.incrementBalance).not.toHaveBeenCalled();
      expect(transactionRepository.updateStatus).toHaveBeenCalledWith(
        mockTransactionId,
        TransactionStatus.COMPLETED,
        undefined,
      );
    });

    it('should process a failed payment', async () => {
      const mockMolliePayment = {
        id: molliePaymentId,
        status: 'failed',
        amount: {
          currency: 'EUR',
          value: '100.00',
        },
        method: 'ideal',
        description: 'Test payment',
        createdAt: new Date().toISOString(),
        mode: 'test',
        resource: 'payment',
        profileId: 'profile_123',
        _links: {
          self: {
            href: 'https://api.mollie.com/v2/payments/tr_123',
            type: 'application/hal+json',
          },
        },
      } as unknown as Payment;

      const mockTransaction = {
        _id: mockObjectId,
        userId,
        amount,
        status: TransactionStatus.PENDING,
        type: TransactionType.DEPOSIT,
        paymentMethod: 'ideal',
      } as PartialMockedTransaction;

      mollieService.getPayment.mockResolvedValue(mockMolliePayment);
      transactionRepository.findByReference.mockResolvedValue(mockTransaction as unknown as Transaction);

      await service.handlePaymentWebhook({ id: molliePaymentId });

      expect(userBalanceRepository.incrementBalance).not.toHaveBeenCalled();
      expect(transactionRepository.updateStatus).toHaveBeenCalledWith(
        mockTransactionId,
        TransactionStatus.FAILED,
        'Payment failed',
      );
    });

    it('should throw NotFoundException when transaction is not found', async () => {
      const mockMolliePayment = {
        id: molliePaymentId,
        status: 'paid',
        amount: {
          currency: 'EUR',
          value: '100.00',
        },
        method: 'ideal',
        description: 'Test payment',
        createdAt: new Date().toISOString(),
        mode: 'test',
        resource: 'payment',
        profileId: 'profile_123',
        _links: {
          self: {
            href: 'https://api.mollie.com/v2/payments/tr_123',
            type: 'application/hal+json',
          },
        },
      } as unknown as Payment;

      mollieService.getPayment.mockResolvedValue(mockMolliePayment);
      transactionRepository.findByReference.mockResolvedValue(null);

      await expect(service.handlePaymentWebhook({ id: molliePaymentId })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTransaction', () => {
    it('should return a transaction if found', async () => {
      const mockTransaction = {
        _id: mockObjectId,
        userId: 'user123',
        amount: 100,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        paymentMethod: 'ideal',
      } as PartialMockedTransaction;

      transactionRepository.findById.mockResolvedValue(mockTransaction as unknown as Transaction);

      const result = await service.getTransaction(mockTransactionId);
      expect(transactionRepository.findById).toHaveBeenCalledWith(mockTransactionId);
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      transactionRepository.findById.mockResolvedValue(null);

      await expect(service.getTransaction(mockTransactionId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserTransactions', () => {
    it('should return user transactions', async () => {
      const userId = 'user123';
      const mockTransactions = [
        {
          _id: mockObjectId,
          userId,
          amount: 100,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          paymentMethod: 'ideal',
        } as PartialMockedTransaction,
        {
          _id: new Types.ObjectId(),
          userId,
          amount: 200,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
          paymentMethod: 'ideal',
        } as PartialMockedTransaction,
      ];

      transactionRepository.getUserTransactions.mockResolvedValue(mockTransactions as unknown as Transaction[]);

      const result = await service.getUserTransactions(userId);
      expect(transactionRepository.getUserTransactions).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockTransactions);
      expect(result.length).toBe(2);
    });
  });

  describe('getUserBalance', () => {
    it('should return user balance', async () => {
      const userId = 'user123';
      const balance = 500;

      userBalanceRepository.getUserBalance.mockResolvedValue(balance);

      const result = await service.getUserBalance(userId);
      expect(userBalanceRepository.getUserBalance).toHaveBeenCalledWith(userId);
      expect(result).toBe(balance);
    });
  });
});