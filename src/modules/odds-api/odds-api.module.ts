import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OddsApiService } from "./odds-api.service";


@Module({
    imports: [
        HttpModule,
        ConfigModule,
    ],
    providers: [OddsApiService],
    exports:[OddsApiService]
})

export class OddsApiModule {}