import { Controller, Get } from "@nestjs/common";


@Controller('events')
export class EventsController {
    constructor(private readonly oddsApiService){}

    @Get('leagues')
    async getEuropeanFootballLeagues(){
        return this.oddsApiService.getEuropeanFootballLeagues();
    }
}