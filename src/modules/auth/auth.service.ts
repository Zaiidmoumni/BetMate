import { BadRequestException, Injectable } from '@nestjs/common';
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

  async register(registerDto: RegisterDto): Promise<{ message: string; user: Partial<User> }> {
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
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          email: newUser.email,
          name: newUser.name,
        }
      };
  }
  async verifyEmail(token: string): Promise<{ message: string }> {
    try {

        // Verify Token
      const decoded = this.jwtService.verify(token);

        // Find user by email   
      const user = await this.authRepository.findByEmail(decoded.email);

      if (!user) {
        throw new BadRequestException('Invalid token');
      }

      if(user.isVerified) {
        throw new BadRequestException('Email already verified');
      }

      await this.authRepository.markEmailAsVerified(decoded.email);

      return { message: 'Email verified successfully, Please login to continue.' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  // async login(loginDto: LoginDto): Promise<{ token: string, user: Partial<User> }> {
  //   try {
  //   const { email, password } = loginDto;

  //   // Find user by email
  //   const user = await this.authRepository.findByEmail(email);
  //   if (!user) {
  //     throw new BadRequestException('Invalid credentials');
  //   }

  //   if (!user.isVerified) {
  //     throw new BadRequestException('Please verify your email first');
  //   }

  //   // Compare Password
  //   const isPasswordValid = await bcrypt.compare(password, user.password);
  //   if (!isPasswordValid) {
  //     throw new BadRequestException('Invalid credentials');
  //   }

  //   // Generate JWT
  //   const token = this.jwtService.sign({ email: user._id });

  //   return {
  //     token,
  //     user: {
  //       email: user.email,
  //       name: user.name,
  //     }
  //   };
  // } catch (error) {
  //   throw new BadRequestException('Invalid credentials');
  // // }

  // }
  async login(loginDto: LoginDto, res: Response): Promise<{ accessToken: string, user: Partial<User> }> {
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
        name: user.name
      }
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET
      });

      // Generate new access token
      const accessToken = await this.generateAccessToken(decoded.sub);

      return { accessToken };
    } catch (error) {
      throw new BadRequestException('Invalid token');
    }
  }

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

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: true, // for HTTPS
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/auth/refresh', // Only sent to refresh endpoint
    });
  }

  private async generateAccessToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION
      }
    );
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRATION,
      }
    );
  }
}
