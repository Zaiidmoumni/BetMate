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
        HttpStatus.BAD_REQUEST
      );
    }

    return this.fetchOddsForSport(leagueKey);
  }

  // Get a specific match by its ID
  async getMatchById(matchId: string) {
    const url = `${this.apiUrl}/events/${matchId}/odds`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, {
        params: {
          apiKey: this.apiKey,
          regions: 'eu',
          markets: 'h2h,spreads,totals',
          dateFormat: 'iso',
          oddsFormat: 'decimal',
        },
      }).pipe(
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

  // Helper method to fetch odds from the API
  private async fetchOddsForSport(
    sportKey: string, 
    regions: string = 'eu', 
    markets: string = 'h2h,spreads,totals',
    dateFormat: string = 'iso',
    oddsFormat: string = 'decimal'
  ) {
    const url = `${this.apiUrl}/sports/${sportKey}/odds`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, {
        params: {
          apiKey: this.apiKey,
          regions,
          markets,
          dateFormat,
          oddsFormat,
        },
      }).pipe(
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

  // Format match data for more consistent frontend use
  formatMatchData(matchData) {
    return matchData.map(match => ({
      id: match.id,
      leagueKey: match.sport_key,
      leagueTitle: match.sport_title,
      commenceTime: match.commence_time,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      bookmakers: match.bookmakers.map(bookmaker => ({
        key: bookmaker.key,
        title: bookmaker.title,
        lastUpdate: bookmaker.last_update,
        markets: bookmaker.markets.map(market => ({
          key: market.key,
          outcomes: market.outcomes.map(outcome => ({
            name: outcome.name,
            price: outcome.price,
            point: outcome.point || null,
          })),
        })),
      })),
    }));
  }
}