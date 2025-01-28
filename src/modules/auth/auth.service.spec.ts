import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let userModel: any;
  let jwtService: JwtService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken('User'),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken('User'));
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw BadRequestException if the user already exists', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue({ email: 'test@example.com' });

      await expect(
        authService.register({ email: 'test@example.com', password: 'password123', name: 'Test User' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a new user and send a verification email', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(userModel, 'create').mockResolvedValue({
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
      });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      jest.spyOn(jwtService, 'sign').mockReturnValue('testToken');
      jest.spyOn(mailService, 'sendVerificationEmail').mockResolvedValue(true);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result).toEqual({
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
      expect(userModel.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
      });
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith('test@example.com', 'testToken');
    });

    it('should throw BadRequestException if email sending fails', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(userModel, 'create').mockResolvedValue({
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
      });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      jest.spyOn(jwtService, 'sign').mockReturnValue('testToken');
      jest.spyOn(mailService, 'sendVerificationEmail').mockResolvedValue(false);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password hashing fails', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockRejectedValue(new Error('Hashing failed') as never);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      ).rejects.toThrow(Error);
    });
  });

  describe('verifyEmail', () => {
    it('should verify the email successfully', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({ email: 'test@example.com' });
      jest.spyOn(userModel, 'findOne').mockResolvedValue({
        email: 'test@example.com',
        isVerified: false,
        save: jest.fn(),
      });

      const result = await authService.verifyEmail('testToken');

      expect(result).toEqual({
        message: 'Email verified successfully, Please login to continue.',
      });
    });

    it('should throw BadRequestException for an invalid token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error();
      });

      await expect(authService.verifyEmail('invalidToken')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if the user is not found', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({ email: 'test@example.com' });
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);

      await expect(authService.verifyEmail('testToken')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if the email is already verified', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({ email: 'test@example.com' });
      jest.spyOn(userModel, 'findOne').mockResolvedValue({
        email: 'test@example.com',
        isVerified: true,
      });

      await expect(authService.verifyEmail('testToken')).rejects.toThrow(BadRequestException);
    });
  });
});
