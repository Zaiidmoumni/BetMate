import { Module } from "@nestjs/common";
import { OddsApiModule } from "../odds-api/odds-api.module";
import { EventsController } from "./events.controller";


@Module({
    imports:[OddsApiModule],
    controllers:[EventsController]
})

export class EventsModule {}