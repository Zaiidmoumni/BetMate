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

@Controller('bet')
export class BetController {
  constructor(private readonly betService: BetService) {}

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

  @UseGuards(AccessTokenGuard)
  @Get(':betId')
  async getBetById(@Param('betId') betId: string) {
    return this.betService.getBetById(betId)
  }
}

