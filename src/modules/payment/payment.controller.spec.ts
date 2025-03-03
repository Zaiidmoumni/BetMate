import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './services/payment.service';
import { BadRequestException } from '@nestjs/common';
import { TransactionStatus } from './transaction.schema';
import { Response } from 'express';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: jest.Mocked<PaymentService>;

  beforeEach(async () => {
    const mockPaymentService = {
      initiateDeposit: jest.fn(),
      handlePaymentWebhook: jest.fn(),
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
  });
});