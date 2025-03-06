import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class OddsApiService {
  private readonly apiKey: string;
  private readonly apiUrl: string = 'https://api.the-odds-api.com/v4';
  private readonly europeanFootballGroups = [
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

  async getEuropeanFootballLeagues() {
    const allSports = await this.getSports();
    return allSports.filter((sport) =>
      this.europeanFootballGroups.includes(sport.key),
    );
  }

  async getSports() {
    const url = `${this.apiUrl}/sports`;
    const { data } = await firstValueFrom(this.httpService.get(url, {
        params: { apiKey : this.apiKey},
    }).pipe(
        catchError((error) => {
            throw new HttpException(
              `Failed to fetch sports: ${error.message}`,
              HttpStatus.BAD_GATEWAY,
            );
          }),
    ));
    return data;
  }
}
