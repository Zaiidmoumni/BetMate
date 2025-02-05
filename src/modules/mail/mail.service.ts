import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendVerificationEmail(email: string, token: string) {
    try {
      const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${token}`;

      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to BetMate - Verify Your Email',
        html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to BetMate!</h2>
                    <p>Please verify your email address by clicking the link below:</p>
                    <a 
                      href="${verificationLink}" 
                      style="display: inline-block; padding: 10px 20px; background-color: #1E88E5; color: white; text-decoration: none; border-radius: 5px;"
                    >
                      Verify Email
                    </a>
                    <p>Or copy this link:</p>
                    <p>${verificationLink}</p>
                    <p>This link will expire in 5 minutes.</p>
                  </div>
                `,
      });
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

      await this.mailerService.sendMail({
        to: email,
        subject: 'BetMate - Password Reset',
        html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset</h2>
                    <p>You have requested to reset your password. Click the link below to reset it:</p>
                    <a
                      href="${resetLink}"
                      style="display: inline-block; padding: 10px 20px; background-color: #1E88E5; color: white; text-decoration: none; border-radius: 5px;"
                    >
                      Reset Password
                    </a>
                    <p>Or copy this link:</p>
                    <p>${resetLink}</p>
                    <p>This link will expire in 5 minutes.</p>
                            <p>If you didn't request this, please ignore this email.</p>

                  </div>
                `,
      });
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  async sendPasswordChangedNotification(email: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'BetMate - Password Changed',
        html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Changed</h2>
                    <p>Your password has been changed successfully.</p>
                    <p>If you didn't make this change, please contact us immediately.</p>
                  </div>
                `,
      });
      return true;
    } catch (error) {
      console.error('Error sending password changed email:', error);
      return false;
    }
  }
}
