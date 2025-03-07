import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { OddsApiService } from '../odds-api/odds-api.service';
import { HttpException } from '@nestjs/common';

describe('EventsController', () => {
  let controller: EventsController;
  let oddsApiService: OddsApiService;

  // Mock data for testing
  const mockLeagues = [
    { key: 'soccer_epl', title: 'Premier League', active: true },
    { key: 'soccer_spain_la_liga', title: 'La Liga', active: true },
  ];

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
        ],
      },
    ],
  };

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
        ],
      },
    ],
  };

  const mockRawMatches = [mockRawMatch];
  const mockFormattedMatches = [mockFormattedMatch];

  beforeEach(async () => {
    // Create a mock of OddsApiService
    const mockOddsApiService = {
      getSupportedLeagues: jest.fn(),
      getMatchesByLeague: jest.fn(),
      getMatchById: jest.fn(),
      formatMatchData: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: OddsApiService,
          useValue: mockOddsApiService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    oddsApiService = module.get<OddsApiService>(OddsApiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSupportedLeagues', () => {
    it('should return an array of supported leagues', async () => {
      // Arrange
      jest.spyOn(oddsApiService, 'getSupportedLeagues').mockResolvedValue(mockLeagues);

      // Act
      const result = await controller.getSupportedLeagues();

      // Assert
      expect(result).toEqual(mockLeagues);
      expect(oddsApiService.getSupportedLeagues).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from the service', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch leagues';
      jest.spyOn(oddsApiService, 'getSupportedLeagues').mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.getSupportedLeagues()).rejects.toThrow(errorMessage);
    });
  });

  describe('getMatchesByLeague', () => {
    it('should return formatted matches for a given league', async () => {
      // Arrange
      const leagueKey = 'soccer_epl';
      jest.spyOn(oddsApiService, 'getMatchesByLeague').mockResolvedValue(mockRawMatches);
      jest.spyOn(oddsApiService, 'formatMatchData').mockReturnValue(mockFormattedMatches);

      // Act
      const result = await controller.getMatchesByLeague(leagueKey);

      // Assert
      expect(result).toEqual(mockFormattedMatches);
      expect(oddsApiService.getMatchesByLeague).toHaveBeenCalledWith(leagueKey);
      expect(oddsApiService.formatMatchData).toHaveBeenCalledWith(mockRawMatches);
    });

    it('should handle errors when league is not supported', async () => {
      // Arrange
      const leagueKey = 'unsupported_league';
      jest.spyOn(oddsApiService, 'getMatchesByLeague').mockRejectedValue(
        new HttpException('Unsupported league', 400)
      );

      // Act & Assert
      await expect(controller.getMatchesByLeague(leagueKey)).rejects.toThrow(HttpException);
    });

    it('should propagate service errors', async () => {
      // Arrange
      const leagueKey = 'soccer_epl';
      const errorMessage = 'API unavailable';
      jest.spyOn(oddsApiService, 'getMatchesByLeague').mockRejectedValue(
        new HttpException(errorMessage, 502)
      );

      // Act & Assert
      await expect(controller.getMatchesByLeague(leagueKey)).rejects.toThrow(HttpException);
    });
  });

  describe('getMatchById', () => {
    it('should return a formatted match for a given ID', async () => {
      // Arrange
      const matchId = 'match123';
      jest.spyOn(oddsApiService, 'getMatchById').mockResolvedValue(mockRawMatch);
      jest.spyOn(oddsApiService, 'formatMatchData').mockReturnValue(mockFormattedMatches);

      // Act
      const result = await controller.getMatchById(matchId);

      // Assert
      expect(result).toEqual(mockFormattedMatch);
      expect(oddsApiService.getMatchById).toHaveBeenCalledWith(matchId);
      expect(oddsApiService.formatMatchData).toHaveBeenCalledWith([mockRawMatch]);
    });

    it('should handle errors when match is not found', async () => {
      // Arrange
      const matchId = 'nonexistent_match';
      jest.spyOn(oddsApiService, 'getMatchById').mockRejectedValue(
        new HttpException('Match not found', 404)
      );

      // Act & Assert
      await expect(controller.getMatchById(matchId)).rejects.toThrow(HttpException);
    });

    it('should propagate service errors', async () => {
      // Arrange
      const matchId = 'match123';
      const errorMessage = 'API unavailable';
      jest.spyOn(oddsApiService, 'getMatchById').mockRejectedValue(
        new HttpException(errorMessage, 502)
      );

      // Act & Assert
      await expect(controller.getMatchById(matchId)).rejects.toThrow(HttpException);
    });
  });
});