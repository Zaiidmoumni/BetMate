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

  // Find a specific bet
  @UseGuards(AccessTokenGuard)
  @Get(':betId')
  async getBetById(@Param('betId') betId: string) {
    return this.betService.getBetById(betId)
  }

  // Manually check a bet's result
  @UseGuards(AccessTokenGuard)
  @Get('check/:betId')
  async checkBetById(@Param('betId') betId: string) {
    return this.betService.checkBetById(betId)
  }

  // Manuallu check all bets
  @UseGuards(AccessTokenGuard)
  @Get('check')
  async checkAllBets() {
    return this.betService.checkPendingBets()
  }

  // Cron job to check pending bets every hour
  @Cron('0 */1 * * *')
  async handleCron() {
    await this.betService.checkPendingBets();
  }
}

