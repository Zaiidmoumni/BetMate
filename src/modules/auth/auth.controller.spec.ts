import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '@/modules/users/schemas/user.schema';

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