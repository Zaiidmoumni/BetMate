import { Controller, Get, Param } from '@nestjs/common';
import { OddsApiService } from '../odds-api/odds-api.service';

@Controller('events')
export class EventsController {
  constructor(private readonly oddsApiService: OddsApiService) {}

  // Get all supported leagues
  @Get('leagues')
  async getSupportedLeagues() {
    return this.oddsApiService.getSupportedLeagues();
  }

  // Get matches for a specific league
  @Get('leagues/:leagueKey/matches')
  async getMatchesByLeague(@Param('leagueKey') leagueKey: string) {
    const matches = await this.oddsApiService.getMatchesByLeague(leagueKey);
    return this.oddsApiService.formatMatchData(matches);
  }

  // Get a specific match by ID
  @Get('matches/:matchId')
  async getMatchById(@Param('matchId') matchId: string) {
    const match = await this.oddsApiService.getMatchById(matchId);
    return this.oddsApiService.formatMatchData([match])[0];
  }
}
