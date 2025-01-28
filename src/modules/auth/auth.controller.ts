import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto:RegisterDto) {
    try {
      const user = await this.authService.register(registerDto);
      return user;
    } catch (error) {
      return error;
    }
  }

  @Get('verify')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.authService.login(loginDto);
      return user;
    } catch (error) {
      return error;
    }
  }
}
