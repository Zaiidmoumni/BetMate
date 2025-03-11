import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class OddsApiService {
  private readonly apiKey: string;
  private readonly apiUrl: string = 'https://api.the-odds-api.com/v4';
  private readonly supportedLeagues = [
    'soccer_uefa_champs_league', // UEFA Champions League
    'soccer_uefa_europa_league', // UEFA Europa League
    'soccer_uefa_nations_league', // UEFA Nations League
    'soccer_spain_la_liga', // La Liga
    'soccer_epl', // Premier League
    'soccer_italy_serie_a', // Serie A
    'soccer_germany_bundesliga', // Bundesliga
    'soccer_france_ligue_one', // Ligue 1
  ];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('ODDS_API_KEY');
    if (!this.apiKey) {
      throw new Error('ODDS_API_KEY is not defined in environment variables');
    }
  }

  // Get all supported football leagues
  async getSupportedLeagues() {
    const allSports = await this.getAllSports();
    return allSports.filter((sport) =>
      this.supportedLeagues.includes(sport.key),
    );
  }

  // Get all sports from the API
  async getAllSports() {
    const url = `${this.apiUrl}/sports`;
    const { data } = await firstValueFrom(
      this.httpService
        .get(url, {
          params: { apiKey: this.apiKey },
        })
        .pipe(
          catchError((error) => {
            throw new HttpException(
              `Failed to fetch sports: ${error.message}`,
              HttpStatus.BAD_GATEWAY,
            );
          }),
        ),
    );
    return data;
  }

  // Get matches/games for a specific league
  async getMatchesByLeague(leagueKey: string) {
    // Validate that the requested league is one we support
    if (!this.supportedLeagues.includes(leagueKey)) {
      throw new HttpException(
        'Unsupported league. Please use one of our supported football leagues.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.fetchOddsForSport(leagueKey);
  }

  // Get a specific match by its ID
  async getMatchById(matchId: string) {
    const url = `${this.apiUrl}/events/${matchId}/odds`;
    const { data } = await firstValueFrom(
      this.httpService
        .get(url, {
          params: {
            apiKey: this.apiKey,
            regions: 'eu',
            markets: 'h2h,spreads,totals',
            dateFormat: 'iso',
            oddsFormat: 'decimal',
          },
        })
        .pipe(
          catchError((error) => {
            throw new HttpException(
              `Failed to fetch match: ${error.message}`,
              HttpStatus.BAD_GATEWAY,
            );
          }),
        ),
    );
    return data;
  }

  // Get match results/scores
  async getLeagueScores(sportKey: string, daysFrom: number = 1) {
    const url = `${this.apiUrl}/sports/${sportKey}/scores`;
    const { data } = await firstValueFrom(
      this.httpService
        .get(url, {
          params: {
            apiKey: this.apiKey,
            daysFrom,
            dateFormat: 'iso',
          },
        })
        .pipe(
          catchError((error) => {
            throw new HttpException(
              `Failed to fetch scores: ${error.message}`,
              HttpStatus.BAD_GATEWAY,
            );
          }),
        ),
    );
    return this.formatScoresData(data);
  }


  /*
   * Helper Methods
   * These methods are used to fetch data from the Odds API
   * and format it for more consistent frontend use
   */

  // Fetch odds from the API
  private async fetchOddsForSport(
    sportKey: string,
    regions: string = 'eu',
    markets: string = 'h2h,spreads,totals',
    dateFormat: string = 'iso',
    oddsFormat: string = 'decimal',
  ) {
    const url = `${this.apiUrl}/sports/${sportKey}/odds`;
    const { data } = await firstValueFrom(
      this.httpService
        .get(url, {
          params: {
            apiKey: this.apiKey,
            regions,
            markets,
            dateFormat,
            oddsFormat,
          },
        })
        .pipe(
          catchError((error) => {
            throw new HttpException(
              `Failed to fetch matches: ${error.message}`,
              HttpStatus.BAD_GATEWAY,
            );
          }),
        ),
    );
    return data;
  }

  // Format match data 
  formatMatchData(matchData) {
    return matchData.map((match) => ({
      id: match.id,
      leagueKey: match.sport_key,
      leagueTitle: match.sport_title,
      commenceTime: match.commence_time,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      bookmakers: match.bookmakers.map((bookmaker) => ({
        key: bookmaker.key,
        title: bookmaker.title,
        lastUpdate: bookmaker.last_update,
        markets: bookmaker.markets.map((market) => ({
          key: market.key,
          outcomes: market.outcomes.map((outcome) => ({
            name: outcome.name,
            price: outcome.price,
            point: outcome.point || null,
          })),
        })),
      })),
    }));
  }

  // Format scores data 
  private formatScoresData(scoresData) {
    return scoresData.map((match) => ({
      id: match.id,
      sportKey: match.sport_key,
      sportTitle: match.sport_title,
      commenceTime: match.commence_time,
      completed: match.completed,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      // Soccer-specific scores format
      scores: match.scores
        ? {
            homeScore: match.scores.find((s) => s.name === match.home_team)
              ?.score,
            awayScore: match.scores.find((s) => s.name === match.away_team)
              ?.score,
            // Additional soccer-specific data if available
            homeScoreHalftime: match.scores.find(
              (s) => s.name === match.home_team,
            )?.score_halftime,
            awayScoreHalftime: match.scores.find(
              (s) => s.name === match.away_team,
            )?.score_halftime,
          }
        : null,
      lastUpdate: match.last_update,
    }));
  }

  
}