import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BetService } from './bet.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { UpdateBetDto } from './dto/update-bet.dto';
import { AccessTokenGuard } from '@/guards/accessToken.guard';
import { Cron } from '@nestjs/schedule';
import { AdminGuard } from '@/guards/admin.guard';

@Controller('bet')
export class BetController {
  constructor(private readonly betService: BetService) {}

  // Place a bet
  @UseGuards(AccessTokenGuard)
  @Post()
  async placeBet(
    @Body()
    betData: CreateBetDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.betService.placeBet(userId, betData);
  }

  // Manually check all bets
  @UseGuards(AccessTokenGuard)
  @Get('check')
  async checkAllBets() {
    return this.betService.checkPendingBets();
  }

  // Find user's bets
  @UseGuards(AccessTokenGuard)
  @Get('history')
  async getUserBets(@Request() req) {
    const userId = req.user.userId;
    return this.betService.getUserBets(userId);
  }

  // Admin: Find all bets
  @UseGuards(AccessTokenGuard, AdminGuard)
  @Get('all')
  async getAllBets() {
    return this.betService.getAllBets();
  }

  // Find a specific bet
  @UseGuards(AccessTokenGuard)
  @Get(':betId')
  async getBetById(@Param('betId') betId: string) {
    return this.betService.getBetById(betId);
  }

  // Manually check a bet's result
  @UseGuards(AccessTokenGuard)
  @Get('check/:betId')
  async checkBetById(@Param('betId') betId: string) {
    return this.betService.checkBetById(betId);
  }
}
