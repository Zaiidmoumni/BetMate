import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

describe('MailService', () => {
  let mailService: MailService;
  let mailerService: MailerService;

  // Mock environment variables
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      FRONTEND_URL: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  describe('sendVerificationEmail', () => {
    const testEmail = 'test@example.com';
    const testToken = 'verification-token-123';

    it('should send verification email successfully', async () => {
      jest.spyOn(mailerService, 'sendMail').mockResolvedValueOnce(true);

      const result = await mailService.sendVerificationEmail(testEmail, testToken);

      expect(result).toBe(true);
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: testEmail,
        subject: 'Welcome to BetMate - Verify Your Email',
        html: expect.stringContaining(`${process.env.FRONTEND_URL}/verify?token=${testToken}`),
      });
    });

    it('should return false when email sending fails', async () => {
      jest.spyOn(mailerService, 'sendMail').mockRejectedValueOnce(new Error('Sending failed'));

      const result = await mailService.sendVerificationEmail(testEmail, testToken);

      expect(result).toBe(false);
    });
  });

  describe('sendPasswordResetEmail', () => {
    const testEmail = 'test@example.com';
    const testToken = 'reset-token-123';

    it('should send password reset email successfully', async () => {
      jest.spyOn(mailerService, 'sendMail').mockResolvedValueOnce(true);

      const result = await mailService.sendPasswordResetEmail(testEmail, testToken);

      expect(result).toBe(true);
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: testEmail,
        subject: 'BetMate - Password Reset',
        html: expect.stringContaining(`${process.env.FRONTEND_URL}/reset-password?token=${testToken}`),
      });
    });

    it('should return false when email sending fails', async () => {
      jest.spyOn(mailerService, 'sendMail').mockRejectedValueOnce(new Error('Sending failed'));

      const result = await mailService.sendPasswordResetEmail(testEmail, testToken);

      expect(result).toBe(false);
    });
  });

  describe('sendPasswordChangedNotification', () => {
    const testEmail = 'test@example.com';

    it('should send password changed notification successfully', async () => {
      jest.spyOn(mailerService, 'sendMail').mockResolvedValueOnce(true);

      const result = await mailService.sendPasswordChangedNotification(testEmail);

      expect(result).toBe(true);
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: testEmail,
        subject: 'BetMate - Password Changed',
        html: expect.stringContaining('Password Changed'),
      });
    });

    it('should return false when email sending fails', async () => {
      jest.spyOn(mailerService, 'sendMail').mockRejectedValueOnce(new Error('Sending failed'));

      const result = await mailService.sendPasswordChangedNotification(testEmail);

      expect(result).toBe(false);
    });
  });
});