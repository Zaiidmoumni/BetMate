import { Module } from '@nestjs/common';
import { BetService } from './bet.service';
import { BetController } from './bet.controller';
import { BetRepository } from './bet.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Bet, BetSchema } from './bet.schema';
import { OddsApiModule } from '../odds-api/odds-api.module';
import { UserBalanceRepository } from '../payment/repositories/user-balance.repository';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bet.name, schema: BetSchema }, {name: User.name, schema: UserSchema}]),
    OddsApiModule,
  ],
  controllers: [BetController],
  providers: [BetService, BetRepository, UserBalanceRepository],
  exports:[BetService]
})
export class BetModule {}
