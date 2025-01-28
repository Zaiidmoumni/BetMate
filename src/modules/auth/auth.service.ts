import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/schemas/user.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string; user: Partial<User> }> {
    const { email, password, name } = registerDto;

    // Check if the user already exists
    const user = await this.userModel.findOne({ email });
    if (user) {
        throw new BadRequestException('User already exists');
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await this.userModel.create({
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
      const user = await this.userModel.findOne({ email: decoded.email });

      if (!user) {
        throw new BadRequestException('Invalid token');
      }

      if(user.isVerified) {
        throw new BadRequestException('Email already verified');
      }

      user.isVerified = true;
      await user.save();

      return { message: 'Email verified successfully, Please login to continue.' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async login(loginDto: LoginDto): Promise<{ token: string, user: Partial<User> }> {
    try {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userModel.findOne({ email });
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

    // Generate JWT
    const token = this.jwtService.sign({ email: user._id });

    return {
      token,
      user: {
        email: user.email,
        name: user.name,
      }
    };
  } catch (error) {
    throw new BadRequestException('Invalid credentials');
  }

  }
}
