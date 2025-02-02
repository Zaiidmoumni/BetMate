import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { User } from '../users/schemas/user.schema';
import { Cookies } from '@/decorators/cookies.decorator';
import { AccessTokenGuard } from '@/guards/accessToken.guard';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
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
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    return this.authService.login(loginDto, res);
  }

  @Get('refresh')
  async refreshToken(
    @Cookies('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    if(!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    const accessToken = await this.authService.refreshAccessToken(refreshToken);
    return accessToken ;
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    // console.log('logout');
    
    return this.authService.logout(res);
  }

  @Post('forgot-password')
async requestPasswordReset(@Body() requestDto: RequestPasswordResetDto) {
  return this.authService.requestPasswordReset(requestDto.email);
}

@Post('reset-password')
async resetPassword(@Body() resetDto: ResetPasswordDto) {
  return this.authService.resetPassword(resetDto.token, resetDto.password);
}

}


