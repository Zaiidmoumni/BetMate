import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './services/payment.service';
import { BadRequestException } from '@nestjs/common';
import { TransactionStatus, Transaction } from './transaction.schema';
import { Response } from 'express';
import { WithdrawalDto } from './dto/withdrawal.dto';

// Define proper interfaces based on the error messages
interface WithdrawalResponse {
  transactionId: string;
  estimatedCompletionTime: string; // Note: String, not Date
  status: TransactionStatus;
}

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: jest.Mocked<PaymentService>;

  beforeEach(async () => {
    const mockPaymentService = {
      initiateDeposit: jest.fn(),
      handlePaymentWebhook: jest.fn(),
      initiateWithdrawal: jest.fn(),
      cancelWithdrawal: jest.fn(),
      processWithdrawal: jest.fn(),
      getTransaction: jest.fn(),
      getUserTransactions: jest.fn(),
      getUserBalance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PaymentService, useValue: mockPaymentService },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    paymentService = module.get(PaymentService) as jest.Mocked<PaymentService>;
  });

  describe('initiateDeposit', () => {
    it('should call paymentService.initiateDeposit with correct parameters', async () => {
      const mockUserId = 'user123';
      const mockAmount = 100;
      const mockPaymentMethod = 'ideal';
      const mockRequest = {
        user: { userId: mockUserId },
      };
      const mockDepositData = {
        amount: mockAmount,
        paymentMethod: mockPaymentMethod,
      };
      const expectedResponse = {
        transactionId: 'trans123',
        checkoutUrl: 'https://checkout.url',
        status: TransactionStatus.PENDING,
      };

      paymentService.initiateDeposit.mockResolvedValue(expectedResponse);

      const result = await controller.initiateDeposit(mockDepositData, mockRequest);

      expect(paymentService.initiateDeposit).toHaveBeenCalledWith(
        mockUserId,
        mockAmount,
        mockPaymentMethod,
      );

      expect(result).toEqual(expectedResponse);
    });

    it('should throw BadRequestException when amount is missing', async () => {
      const mockRequest = {
        user: { userId: 'user123' },
      };
      const mockDepositData = {
        amount: null,
        paymentMethod: 'ideal',
      };

      await expect(controller.initiateDeposit(mockDepositData, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
      expect(paymentService.initiateDeposit).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when paymentMethod is missing', async () => {
      const mockRequest = {
        user: { userId: 'user123' },
      };
      const mockDepositData = {
        amount: 100,
        paymentMethod: null,
      };

      await expect(controller.initiateDeposit(mockDepositData, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
      expect(paymentService.initiateDeposit).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentWebhook', () => {
    it('should call paymentService.handlePaymentWebhook and return 200', async () => {
      const mockWebhookData = { id: 'mollie_123' };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      paymentService.handlePaymentWebhook.mockResolvedValue({ processed: true });

      await controller.handlePaymentWebhook(mockWebhookData, mockResponse);

      expect(paymentService.handlePaymentWebhook).toHaveBeenCalledWith(mockWebhookData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle errors from paymentService.handlePaymentWebhook', async () => {
      const mockWebhookData = { id: 'mollie_123' };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      const error = new Error('Webhook processing failed');
      paymentService.handlePaymentWebhook.mockRejectedValue(error);

      try {
        await controller.handlePaymentWebhook(mockWebhookData, mockResponse);
      } catch (e) {
        expect(e).toBe(error);
      }

      expect(paymentService.handlePaymentWebhook).toHaveBeenCalledWith(mockWebhookData);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.send).not.toHaveBeenCalled();
    });
  });

  describe('initiateWithdrawal', () => {
    it('should call paymentService.initiateWithdrawal with correct parameters', async () => {
      const mockUserId = 'user123';
      // Fixed: Include all required properties of WithdrawalDto
      const mockWithdrawalData: WithdrawalDto = {
        amount: 50,
        bankName: 'Test Bank',
        accountHolder: 'John Doe',
        iban: 'NL91ABNA0417164300'
      };
      const mockRequest = {
        user: { userId: mockUserId },
      };
      
      // Fixed: Use string for estimatedCompletionTime instead of Date
      const expectedResponse: WithdrawalResponse = {
        transactionId: 'withdrawal123',
        estimatedCompletionTime: '2025-03-25T14:00:00Z',
        status: TransactionStatus.PENDING
      };

      paymentService.initiateWithdrawal.mockResolvedValue(expectedResponse);

      const result = await controller.initiateWithdrawal(mockWithdrawalData, mockRequest);

      expect(paymentService.initiateWithdrawal).toHaveBeenCalledWith(
        mockUserId,
        mockWithdrawalData,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should pass through service errors when withdrawal fails', async () => {
      const mockUserId = 'user123';
      // Fixed: Include all required properties of WithdrawalDto
      const mockWithdrawalData: WithdrawalDto = {
        amount: 5000,
        bankName: 'Test Bank',
        accountHolder: 'John Doe',
        iban: 'NL91ABNA0417164300'
      };
      const mockRequest = {
        user: { userId: mockUserId },
      };

      const error = new BadRequestException('Insufficient funds');
      paymentService.initiateWithdrawal.mockRejectedValue(error);

      await expect(controller.initiateWithdrawal(mockWithdrawalData, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
      expect(paymentService.initiateWithdrawal).toHaveBeenCalledWith(
        mockUserId,
        mockWithdrawalData,
      );
    });
  });

  describe('cancelWithdrawal', () => {
    it('should call paymentService.cancelWithdrawal with correct parameters', async () => {
      const mockUserId = 'user123';
      const mockWithdrawalId = 'withdrawal123';
      const mockRequest = {
        user: { userId: mockUserId },
      };
      
      // Fixed: Use mock object for Transaction instead of creating with properties
      const expectedResponse = {
        _id: mockWithdrawalId,
        userId: mockUserId,
        status: TransactionStatus.CANCELLED,
      } as unknown as Transaction;

      paymentService.cancelWithdrawal.mockResolvedValue(expectedResponse);

      const result = await controller.cancelWithdrawal(mockWithdrawalId, mockRequest);

      expect(paymentService.cancelWithdrawal).toHaveBeenCalledWith(
        mockWithdrawalId,
        mockUserId,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors when cancellation fails', async () => {
      const mockUserId = 'user123';
      const mockWithdrawalId = 'withdrawal123';
      const mockRequest = {
        user: { userId: mockUserId },
      };

      const error = new BadRequestException('Cannot cancel processing withdrawal');
      paymentService.cancelWithdrawal.mockRejectedValue(error);

      await expect(controller.cancelWithdrawal(mockWithdrawalId, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
      expect(paymentService.cancelWithdrawal).toHaveBeenCalledWith(
        mockWithdrawalId,
        mockUserId,
      );
    });
  });

  describe('processWithdrawal', () => {
    it('should call paymentService.processWithdrawal with correct parameters', async () => {
      const mockWithdrawalId = 'withdrawal123';
      
      // Fixed: Use mock object for Transaction instead of creating with properties
      const expectedResponse = {
        _id: mockWithdrawalId,
        status: TransactionStatus.COMPLETED,
      } as unknown as Transaction;

      paymentService.processWithdrawal.mockResolvedValue(expectedResponse);

      const result = await controller.processWithdrawal(mockWithdrawalId);

      expect(paymentService.processWithdrawal).toHaveBeenCalledWith(mockWithdrawalId);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors when processing fails', async () => {
      const mockWithdrawalId = 'withdrawal123';

      const error = new BadRequestException('Withdrawal already processed');
      paymentService.processWithdrawal.mockRejectedValue(error);

      await expect(controller.processWithdrawal(mockWithdrawalId)).rejects.toThrow(
        BadRequestException,
      );
      expect(paymentService.processWithdrawal).toHaveBeenCalledWith(mockWithdrawalId);
    });
  });

  describe('getTransaction', () => {
    it('should return transaction when user is authorized', async () => {
      const mockUserId = 'user123';
      const mockTransactionId = 'trans123';
      const mockRequest = {
        user: { userId: mockUserId },
      };
      
      // Fixed: Use a mongoose-compatible mock object
      const mockTransaction = {
        _id: mockTransactionId,
        userId: {
          toString: () => mockUserId
        }
      } as unknown as Transaction;

      paymentService.getTransaction.mockResolvedValue(mockTransaction);

      const result = await controller.getTransaction(mockTransactionId, mockRequest);

      expect(paymentService.getTransaction).toHaveBeenCalledWith(mockTransactionId);
      expect(result).toEqual(mockTransaction);
    });

    it('should throw BadRequestException when user tries to access another user\'s transaction', async () => {
      const mockUserId = 'user123';
      const mockOtherUserId = 'otherUser456';
      const mockTransactionId = 'trans123';
      const mockRequest = {
        user: { userId: mockUserId },
      };
      
      // Fixed: Use a mongoose-compatible mock object
      const mockTransaction = {
        _id: mockTransactionId,
        userId: {
          toString: () => mockOtherUserId
        }
      } as unknown as Transaction;

      paymentService.getTransaction.mockResolvedValue(mockTransaction);

      await expect(controller.getTransaction(mockTransactionId, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
      expect(paymentService.getTransaction).toHaveBeenCalledWith(mockTransactionId);
    });

    it('should handle non-existent transaction', async () => {
      const mockUserId = 'user123';
      const mockTransactionId = 'nonExistentTrans';
      const mockRequest = {
        user: { userId: mockUserId },
      };

      paymentService.getTransaction.mockResolvedValue(null);

      await expect(controller.getTransaction(mockTransactionId, mockRequest)).rejects.toThrow();
      expect(paymentService.getTransaction).toHaveBeenCalledWith(mockTransactionId);
    });
  });

  describe('getUserTransactions', () => {
    it('should call paymentService.getUserTransactions with correct userId', async () => {
      const mockUserId = 'user123';
      const mockRequest = {
        user: { userId: mockUserId },
      };
      
      // Fixed: Use a simpler array of mock transactions
      const mockTransactions = [
        { _id: 'trans1' },
        { _id: 'trans2' }
      ] as unknown as Transaction[];

      paymentService.getUserTransactions.mockResolvedValue(mockTransactions);

      const result = await controller.getUserTransactions(mockRequest);

      expect(paymentService.getUserTransactions).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockTransactions);
    });

    it('should return empty array when user has no transactions', async () => {
      const mockUserId = 'userWithNoTransactions';
      const mockRequest = {
        user: { userId: mockUserId },
      };
      
      paymentService.getUserTransactions.mockResolvedValue([]);

      const result = await controller.getUserTransactions(mockRequest);

      expect(paymentService.getUserTransactions).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual([]);
    });
  });

  describe('getUserBalance', () => {
    it('should call paymentService.getUserBalance with correct userId', async () => {
      const mockUserId = 'user123';
      const mockRequest = {
        user: { userId: mockUserId },
      };
      const mockBalance = 750;

      paymentService.getUserBalance.mockResolvedValue(mockBalance);

      const result = await controller.getUserBalance(mockRequest);

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({ balance: mockBalance });
    });

    it('should return zero balance for new users', async () => {
      const mockUserId = 'newUser';
      const mockRequest = {
        user: { userId: mockUserId },
      };
      const mockBalance = 0;

      paymentService.getUserBalance.mockResolvedValue(mockBalance);

      const result = await controller.getUserBalance(mockRequest);

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({ balance: mockBalance });
    });
  });
});