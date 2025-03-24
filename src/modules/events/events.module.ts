import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { OddsApiModule } from '../odds-api/odds-api.module';

@Module({
  imports: [OddsApiModule],
  controllers: [EventsController],
})
export class EventsModule {}