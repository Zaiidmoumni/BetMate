import { Module } from '@nestjs/common';
import { BetService } from './bet.service';
import { BetController } from './bet.controller';
import { BetRepository } from './bet.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Bet, BetSchema } from './bet.schema';
import { OddsApiModule } from '../odds-api/odds-api.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bet.name, schema: BetSchema }]),
    OddsApiModule,
  ],
  controllers: [BetController],
  providers: [BetService, BetRepository],
  exports:[BetService]
})
export class BetModule {}
