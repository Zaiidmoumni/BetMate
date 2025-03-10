import { Module } from '@nestjs/common';
import { BetService } from './bet.service';
import { BetController } from './bet.controller';
import { BetRepository } from './bet.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Bet, BetSchema } from './bet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bet.name, schema: BetSchema }]),
  ],
  controllers: [BetController],
  providers: [BetService, BetRepository],
  exports:[BetService]
})
export class BetModule {}
