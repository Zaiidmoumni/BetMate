// auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;

  const mockAuthRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    markEmailAsVerified: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockMailService = {
    sendVerificationEmail: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: mockAuthRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should successfully register a new user', async () => {
      // Mock implementations
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.create.mockResolvedValue({
        email: registerDto.email,
        name: registerDto.name,
        id: 'user-id',
      } as any);
      mockJwtService.sign.mockReturnValue('verification-token');
      mockMailService.sendVerificationEmail.mockResolvedValue(true);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          email: registerDto.email,
          name: registerDto.name,
        },
      });
      expect(authRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(authRepository.create).toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already exists', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue({ id: 'existing-user' } as any);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email sending fails', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.create.mockResolvedValue({
        email: registerDto.email,
        name: registerDto.name,
      } as any);
      mockMailService.sendVerificationEmail.mockResolvedValue(false);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    const token = 'valid-token';
    const decodedToken = { email: 'test@example.com' };

    it('should successfully verify email', async () => {
      mockJwtService.verify.mockReturnValue(decodedToken);
      mockAuthRepository.findByEmail.mockResolvedValue({
        email: decodedToken.email,
        isVerified: false,
      } as any);
      mockAuthRepository.markEmailAsVerified.mockResolvedValue(true as any);

      const result = await service.verifyEmail(token);

      expect(result).toEqual({
        message: 'Email verified successfully, Please login to continue.',
      });
      expect(authRepository.markEmailAsVerified).toHaveBeenCalledWith(decodedToken.email);
    });

    it('should throw BadRequestException if token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error();
      });

      await expect(service.verifyEmail(token)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is already verified', async () => {
      mockJwtService.verify.mockReturnValue(decodedToken);
      mockAuthRepository.findByEmail.mockResolvedValue({
        email: decodedToken.email,
        isVerified: true,
      } as any);

      await expect(service.verifyEmail(token)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password',
      isVerified: true,
    };

    beforeEach(() => {
      mockJwtService.signAsync.mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
    });

    it('should successfully login user', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.login(loginDto, mockResponse);

      expect(result).toEqual({
        accessToken: 'access-token',
        user: {
          email: mockUser.email,
          name: mockUser.name,
        },
      });
      expect(mockResponse.cookie).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user is not verified', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        isVerified: false,
      } as any);

      await expect(service.login(loginDto, mockResponse)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password is invalid', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.login(loginDto, mockResponse)).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshAccessToken', () => {
    const refreshToken = 'valid-refresh-token';
    const userId = 'user-id';

    it('should successfully refresh access token', async () => {
      mockJwtService.verify.mockReturnValue({ sub: userId });
      mockJwtService.signAsync.mockResolvedValue('new-access-token');

      const result = await service.refreshAccessToken(refreshToken);

      expect(result).toEqual({
        accessToken: 'access-token',
      });
    });

    it('should throw BadRequestException if refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error();
      });

      await expect(service.refreshAccessToken(refreshToken)).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      const result = await service.logout(mockResponse);

      expect(result).toEqual({
        message: 'Logged out successfully',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/auth/refresh',
      });
    });
  });
});