import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/schemas/user.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { AuthRepository } from './auth.repository';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  // Register a new user
  async register(
    registerDto: RegisterDto,
  ): Promise<{ message: string; user: Partial<User> }> {
    const { email, password, name } = registerDto;

    // Check if the user already exists
    const user = await this.authRepository.findByEmail(email);
    if (user) {
      throw new BadRequestException('User already exists');
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await this.authRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    // Generate Verification Token
    const verificationToken = this.jwtService.sign(
      { email: newUser.email },
      { expiresIn: '5m' },
    );

    // Send Verification Email
    const emailSent = await this.mailService.sendVerificationEmail(
      email,
      verificationToken,
    );

    if (!emailSent) {
      throw new BadRequestException('Failed to send verification email');
    }

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      user: {
        email: newUser.email,
        name: newUser.name,
      },
    };
  }

  // Verify email
  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      // Verify Token
      const decoded = this.jwtService.verify(token);

      // Find user by email
      const user = await this.authRepository.findByEmail(decoded.email);

      if (!user) {
        throw new BadRequestException('Invalid token');
      }

      if (user.isVerified) {
        throw new BadRequestException('Email already verified');
      }

      await this.authRepository.markEmailAsVerified(decoded.email);

      return {
        message: 'Email verified successfully, Please login to continue.',
      };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  // Login user
  async login(
    loginDto: LoginDto,
    res: Response,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new BadRequestException('Please verify your email first');
    }

    // Compare Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    // Generate both tokens
    const accessToken = await this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Set refresh token in HTTP-only cookie
    this.setRefreshTokenCookie(res, refreshToken);

    // Return access token and user data
    return {
      accessToken,
      user: {
        email: user.email,
        name: user.name,
      },
    };
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    // Find user by email
    const user = await this.authRepository.findByEmail(email);

    // Always return the same message to prevent user enumeration
    if (!user) {
      return {
        message:
          'Please check your email for further instructions. If the email exists in our system, we will send a password reset link.',
      };
    }

    // Generate reset token
    const resetToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'password_reset',
      },
      {
        secret: process.env.JWT_RESET_SECRET,
        expiresIn: '15m',
      },
    );

    // Send password reset email
    const emailSent = await this.mailService.sendPasswordResetEmail(
      user.email,
      resetToken,
    );

    if (!emailSent) {
      throw new BadRequestException('Failed to send password reset email');
    }

    return {
      message:
        'Please check your email for further instructions. If the email exists in our system, we will send a password reset link.',
    };
  }

  // Refresh access token
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Generate new access token
      const accessToken = await this.generateAccessToken(decoded.sub);

      return { accessToken };
    } catch (error) {
      throw new BadRequestException('Invalid token');
    }
  }

  // Reset password
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      // Verify token
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_RESET_SECRET,
      });

      // Ensure it's a password reset token
      if (decoded.type !== 'password_reset') {
        throw new BadRequestException('Invalid token type');
      }

      // Find user
      const user = await this.authRepository.findByEmail(decoded.email);
      if (!user) {
        throw new BadRequestException('Invalid token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await this.authRepository.updatePassword(user.id, hashedPassword);

      // Send notification email
      await this.mailService.sendPasswordChangedNotification(user.email);

      return { message: 'Password has been reset successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  // logout
  async logout(res: Response) {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh',
    });

    return { message: 'Logged out successfully' };
  }

  // Get user profile
  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    try {
      const user = await this.authRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      const { password, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
  
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get user data');
    }
  }

  //  Update Profile 
  async updateProfile(userId: string, updateDto: Partial<User>) : Promise<{message: string; user: Partial<User>}> {
    try {
      const user = await this.authRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // If email is being updated
      if (updateDto.email && updateDto.email !== user.email) {
        const existingUser = await this.authRepository.findByEmail(updateDto.email);
        if (existingUser) {
          throw new BadRequestException('Email already in use');
        }

       const update = await this.authRepository.updateEmail(userId, updateDto.email);
        if (!update) {
          throw new BadRequestException('Failed to update email');
        }
        // Generate Verification Token
        const verificationToken = this.jwtService.sign(
          { email: updateDto.email },
          { expiresIn: '5m' },
        );

        await this.mailService.sendVerificationEmail(updateDto.email, verificationToken);
      }

      //  If name is being updated
      if (updateDto.name && updateDto.name !== user.name) {
        const update = await this.authRepository.updateName(userId, updateDto.name);
        if (!update) {
          throw new BadRequestException('Failed to update name');
        }
      }

      // If password is being updated
      if (updateDto.password) {
        const hashedPassword = await bcrypt.hash(updateDto.password, 10);
        await this.authRepository.updatePassword(userId, hashedPassword);
        await this.mailService.sendPasswordChangedNotification(user.email);
      }

      // Return success message
      return {
        message: 'Profile updated successfully',
        user: {
          email: updateDto.email || user.email,
          name: updateDto.name || user.name,
        },
      };

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update profile');
    }
  }

  /*
   * Helper functions
   */

  // Set refresh token in HTTP-only cookie
  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: true, // for HTTPS
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/auth/refresh', // Only sent to refresh endpoint
    });
  }

  // Generate JWT access token
  private async generateAccessToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION,
      },
    );
  }

  // Generate JWT refresh token
  private async generateRefreshToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRATION,
      },
    );
  }

  // Generate password reset token
  private async generatePasswordResetToken(email: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: email },
      {
        secret: process.env.JWT_RESET_PASSWORD_SECRET,
        expiresIn: '5m',
      },
    );
  }
}