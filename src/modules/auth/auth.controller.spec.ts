import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { User } from '@/modules/users/schemas/user.schema';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';

// Mock the decorators and guards
jest.mock('@/decorators/cookies.decorator', () => ({
  Cookies: () => {
    return (target: any, key: string, descriptor: PropertyDescriptor) => {};
  },
}));

jest.mock('@/guards/accessToken.guard', () => ({
  AccessTokenGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true,
  })),
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  // Mock response object
  const mockResponse = {
    clearCookie: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
  } as unknown as Response;

  // Mock AuthService
  const mockAuthService = {
    register: jest.fn(),
    verifyEmail: jest.fn(),
    login: jest.fn(),
    refreshAccessToken: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const expectedUser = { id: '1', ...registerDto };

      mockAuthService.register.mockResolvedValue(expectedUser);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedUser);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should return error if registration fails', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const error = new Error('Registration failed');

      mockAuthService.register.mockRejectedValue(error);

      const result = await controller.register(registerDto);

      expect(result).toEqual(error);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const token = 'valid-token';
      const expectedResult = { message: 'Email verified successfully' };

      mockAuthService.verifyEmail.mockResolvedValue(expectedResult);

      const result = await controller.verifyEmail(token);

      expect(result).toEqual(expectedResult);
      expect(authService.verifyEmail).toHaveBeenCalledWith(token);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = {
        accessToken: 'access-token',
        user: { id: '1', email: 'test@example.com' } as Partial<User>,
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, mockResponse);

      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto, mockResponse);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const expectedResult = { accessToken: 'new-access-token' };

      mockAuthService.refreshAccessToken.mockResolvedValue(expectedResult);

      const result = await controller.refreshToken(refreshToken, mockResponse);

      expect(result).toEqual(expectedResult);
      expect(authService.refreshAccessToken).toHaveBeenCalledWith(refreshToken);
    });

    it('should throw UnauthorizedException when refresh token is missing', async () => {
      const refreshToken = '';

      await expect(controller.refreshToken(refreshToken, mockResponse))
        .rejects
        .toThrow(UnauthorizedException);
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      const requestDto: RequestPasswordResetDto = {
        email: 'test@example.com',
      };
      const expectedResult = {
        message: 'If your email is registered, you will receive reset instructions.',
      };

      mockAuthService.requestPasswordReset.mockResolvedValue(expectedResult);

      const result = await controller.requestPasswordReset(requestDto);

      expect(result).toEqual(expectedResult);
      expect(authService.requestPasswordReset).toHaveBeenCalledWith(requestDto.email);
    });

    it('should return same message even if email does not exist', async () => {
      const requestDto: RequestPasswordResetDto = {
        email: 'nonexistent@example.com',
      };
      const expectedResult = {
        message: 'If your email is registered, you will receive reset instructions.',
      };

      mockAuthService.requestPasswordReset.mockResolvedValue(expectedResult);

      const result = await controller.requestPasswordReset(requestDto);

      expect(result).toEqual(expectedResult);
      expect(authService.requestPasswordReset).toHaveBeenCalledWith(requestDto.email);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetDto: ResetPasswordDto = {
        token: 'valid-token',
        password: 'NewPassword123!',
      };
      const expectedResult = { message: 'Password has been reset successfully' };

      mockAuthService.resetPassword.mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(resetDto);

      expect(result).toEqual(expectedResult);
      expect(authService.resetPassword).toHaveBeenCalledWith(resetDto.token, resetDto.password);
    });

    it('should handle invalid reset token', async () => {
      const resetDto: ResetPasswordDto = {
        token: 'invalid-token',
        password: 'NewPassword123!',
      };

      mockAuthService.resetPassword.mockRejectedValue(new BadRequestException('Invalid or expired token'));

      await expect(controller.resetPassword(resetDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const expectedResult = { message: 'Logged out successfully' };

      mockAuthService.logout.mockResolvedValue(expectedResult);

      const result = await controller.logout(mockResponse);

      expect(result).toEqual(expectedResult);
      expect(authService.logout).toHaveBeenCalledWith(mockResponse);
    });
  });
});