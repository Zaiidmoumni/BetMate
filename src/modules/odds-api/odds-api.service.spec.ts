import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { OddsApiService } from './odds-api.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('OddsApiService', () => {
  let service: OddsApiService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockApiKey = 'mock-api-key';

  // Mock data for testing
  const mockAllSports = [
    { key: 'soccer_epl', title: 'Premier League', active: true },
    { key: 'soccer_spain_la_liga', title: 'La Liga', active: true },
    { key: 'soccer_uefa_champs_league', title: 'UEFA Champions League', active: true },
    { key: 'baseball_mlb', title: 'MLB', active: true },
  ];

  const mockSupportedLeagues = mockAllSports.slice(0, 3);

  const mockRawMatch = {
    id: 'match123',
    sport_key: 'soccer_epl',
    sport_title: 'Premier League',
    commence_time: '2023-01-01T15:00:00Z',
    home_team: 'Manchester United',
    away_team: 'Liverpool',
    bookmakers: [
      {
        key: 'bookmaker1',
        title: 'Bet365',
        last_update: '2023-01-01T14:00:00Z',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Manchester United', price: 2.5 },
              { name: 'Liverpool', price: 2.8 },
              { name: 'Draw', price: 3.2 },
            ],
          },
          {
            key: 'spreads',
            outcomes: [
              { name: 'Manchester United', price: 1.9, point: -1.5 },
              { name: 'Liverpool', price: 1.9, point: 1.5 },
            ],
          },
        ],
      },
    ],
  };

  const mockRawMatches = [mockRawMatch];

  const mockFormattedMatch = {
    id: 'match123',
    leagueKey: 'soccer_epl',
    leagueTitle: 'Premier League',
    commenceTime: '2023-01-01T15:00:00Z',
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    bookmakers: [
      {
        key: 'bookmaker1',
        title: 'Bet365',
        lastUpdate: '2023-01-01T14:00:00Z',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Manchester United', price: 2.5, point: null },
              { name: 'Liverpool', price: 2.8, point: null },
              { name: 'Draw', price: 3.2, point: null },
            ],
          },
          {
            key: 'spreads',
            outcomes: [
              { name: 'Manchester United', price: 1.9, point: -1.5 },
              { name: 'Liverpool', price: 1.9, point: 1.5 },
            ],
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule,
      ],
      providers: [
        OddsApiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ODDS_API_KEY') return mockApiKey;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OddsApiService>(OddsApiService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw an error if API key is not defined', () => {
    jest.spyOn(configService, 'get').mockReturnValue(null);
    expect(() => {
      const service = new OddsApiService(httpService, configService);
    }).toThrow('ODDS_API_KEY is not defined in environment variables');
  });

  describe('getAllSports', () => {
    it('should return all sports from API', async () => {
      // Arrange
      const response: AxiosResponse = {
        data: mockAllSports,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'https://api.the-odds-api.com/v4/sports' } as any,
      };
      
      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(response));

      // Act
      const result = await service.getAllSports();

      // Assert
      expect(result).toEqual(mockAllSports);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.the-odds-api.com/v4/sports', 
        { params: { apiKey: mockApiKey } }
      );
    });

    it('should throw HttpException when API call fails', async () => {
      // Arrange
      jest.spyOn(httpService, 'get').mockReturnValueOnce(
        throwError(() => new Error('API error'))
      );

      // Act & Assert
      await expect(service.getAllSports()).rejects.toThrow(HttpException);
    });
  });

  describe('getSupportedLeagues', () => {
    it('should return only supported football leagues', async () => {
      // Arrange
      jest.spyOn(service, 'getAllSports').mockResolvedValueOnce(mockAllSports);

      // Act
      const result = await service.getSupportedLeagues();

      // Assert
      expect(result).toEqual(mockSupportedLeagues);
      expect(service.getAllSports).toHaveBeenCalled();
    });
  });

  describe('getMatchesByLeague', () => {
    it('should return matches for a supported league', async () => {
      // Arrange
      const leagueKey = 'soccer_epl';
      const response: AxiosResponse = {
        data: mockRawMatches,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: `https://api.the-odds-api.com/v4/sports/${leagueKey}/odds` } as any,
      };
      
      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(response));

      // Act
      const result = await service.getMatchesByLeague(leagueKey);

      // Assert
      expect(result).toEqual(mockRawMatches);
      expect(httpService.get).toHaveBeenCalledWith(
        `https://api.the-odds-api.com/v4/sports/${leagueKey}/odds`, 
        { 
          params: { 
            apiKey: mockApiKey,
            regions: 'eu',
            markets: 'h2h,spreads,totals',
            dateFormat: 'iso',
            oddsFormat: 'decimal',
          } 
        }
      );
    });

    it('should throw HttpException for unsupported league', async () => {
      // Arrange
      const leagueKey = 'baseball_mlb';

      // Act & Assert
      await expect(service.getMatchesByLeague(leagueKey)).rejects.toThrow(HttpException);
    });
  });

  describe('getMatchById', () => {
    it('should return a match by ID', async () => {
      // Arrange
      const matchId = 'match123';
      const response: AxiosResponse = {
        data: mockRawMatch,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: `https://api.the-odds-api.com/v4/events/${matchId}/odds` } as any,
      };
      
      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(response));

      // Act
      const result = await service.getMatchById(matchId);

      // Assert
      expect(result).toEqual(mockRawMatch);
      expect(httpService.get).toHaveBeenCalledWith(
        `https://api.the-odds-api.com/v4/events/${matchId}/odds`, 
        { 
          params: { 
            apiKey: mockApiKey,
            regions: 'eu',
            markets: 'h2h,spreads,totals',
            dateFormat: 'iso',
            oddsFormat: 'decimal',
          } 
        }
      );
    });

    it('should throw HttpException when API call fails', async () => {
      // Arrange
      const matchId = 'match123';
      jest.spyOn(httpService, 'get').mockReturnValueOnce(
        throwError(() => new Error('API error'))
      );

      // Act & Assert
      await expect(service.getMatchById(matchId)).rejects.toThrow(HttpException);
    });
  });

  describe('formatMatchData', () => {
    it('should correctly format match data', () => {
      // Act
      const result = service.formatMatchData(mockRawMatches);

      // Assert
      expect(result).toEqual([mockFormattedMatch]);
    });

    it('should handle outcomes without point values', () => {
      // Arrange
      const rawMatch = {
        ...mockRawMatch,
        bookmakers: [
          {
            ...mockRawMatch.bookmakers[0],
            markets: [
              {
                key: 'h2h',
                outcomes: [
                  { name: 'Team A', price: 2.0 },
                ],
              },
            ],
          },
        ],
      };

      // Act
      const result = service.formatMatchData([rawMatch]);

      // Assert
      expect(result[0].bookmakers[0].markets[0].outcomes[0]).toEqual({
        name: 'Team A',
        price: 2.0,
        point: null,
      });
    });
  });
});