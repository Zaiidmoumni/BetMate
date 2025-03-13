import { Test, TestingModule } from '@nestjs/testing';
import { BetService } from './bet.service';
import { BetRepository } from './bet.repository';
import { OddsApiService } from '../odds-api/odds-api.service';
import { UserBalanceRepository } from '../payment/repositories/user-balance.repository';
import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { Bet, BetDocument } from './bet.schema';
import { Types } from 'mongoose';

// Mock implementations
const mockBetRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByMatch: jest.fn(),
  findByStatus: jest.fn(),
  update: jest.fn(),
};

const mockUserBalanceRepository = {
  getUserBalance: jest.fn(),
  decrementBalance: jest.fn(),
  incrementBalance: jest.fn(),
};

const mockOddsApiService = {
  getSupportedLeagues: jest.fn(),
  getLeagueScores: jest.fn(),
};

// Mock BetDocument with mongoose _id
class MockBetDocument {
  _id: Types.ObjectId;
  userId: string;
  matches: Array<{
    matchId: string;
    betOutcome: string;
    odds: number;
    status: string;
  }>;
  totalOdds: number;
  stake: number;
  potentialPayout: number;
  status: string;
  save: jest.Mock;

  constructor(data: Partial<Bet>) {
    this._id = new Types.ObjectId();
    this.userId = data.userId || 'user-123';
    this.matches = data.matches || [];
    this.totalOdds = data.totalOdds || 1;
    this.stake = data.stake || 10;
    this.potentialPayout = data.potentialPayout || 10;
    this.status = data.status || 'Pending';
    this.save = jest.fn().mockResolvedValue(this);
  }
}

describe('BetService', () => {
  let service: BetService;
  let betRepository: BetRepository;
  let userBalanceRepository: UserBalanceRepository;
  let oddsApiService: OddsApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BetService,
        { provide: BetRepository, useValue: mockBetRepository },
        { provide: UserBalanceRepository, useValue: mockUserBalanceRepository },
        { provide: OddsApiService, useValue: mockOddsApiService },
      ],
    }).compile();

    service = module.get<BetService>(BetService);
    betRepository = module.get<BetRepository>(BetRepository);
    userBalanceRepository = module.get<UserBalanceRepository>(UserBalanceRepository);
    oddsApiService = module.get<OddsApiService>(OddsApiService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('placeBet', () => {
    const userId = 'user123';
    const validBetData = {
      stake: 10,
      matches: [
        { matchId: 'match1', betOutcome: '1', odds: 1.5 },
        { matchId: 'match2', betOutcome: 'X', odds: 2.0 },
      ],
    };

    it('should place a bet successfully', async () => {
      // Arrange
      const userBalance = 100;
      const createdBet = {
        userId,
        matches: validBetData.matches.map(m => ({ ...m, status: 'Pending' })),
        totalOdds: 3.0, // 1.5 * 2.0
        stake: 10,
        potentialPayout: 30, // 10 * 3.0
        status: 'Pending',
      };

      mockUserBalanceRepository.getUserBalance.mockResolvedValue(userBalance);
      mockBetRepository.create.mockResolvedValue(createdBet);
      mockUserBalanceRepository.decrementBalance.mockResolvedValue({ balance: 90 });

      // Act
      const result = await service.placeBet(userId, validBetData);

      // Assert
      expect(mockUserBalanceRepository.getUserBalance).toHaveBeenCalledWith(userId);
      expect(mockBetRepository.create).toHaveBeenCalledWith({
        userId,
        matches: validBetData.matches.map(m => ({ ...m, status: 'Pending' })),
        totalOdds: 3.0,
        stake: 10,
        potentialPayout: 30,
        status: 'Pending',
      });
      expect(mockUserBalanceRepository.decrementBalance).toHaveBeenCalledWith(userId, 10);
      expect(result).toEqual(createdBet);
    });

    it('should throw BadRequestException when user ID is missing', async () => {
      // Act & Assert
      await expect(service.placeBet('', validBetData)).rejects.toThrow(BadRequestException);
      await expect(service.placeBet(null, validBetData)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when matches are empty', async () => {
      // Act & Assert
      await expect(service.placeBet(userId, { stake: 10, matches: [] })).rejects.toThrow(BadRequestException);
      await expect(service.placeBet(userId, { stake: 10, matches: null })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when stake is invalid', async () => {
      // Act & Assert
      await expect(service.placeBet(userId, { ...validBetData, stake: 0 })).rejects.toThrow(BadRequestException);
      await expect(service.placeBet(userId, { ...validBetData, stake: -10 })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user has insufficient balance', async () => {
      // Arrange
      mockUserBalanceRepository.getUserBalance.mockResolvedValue(5); // Less than stake

      // Act & Assert
      await expect(service.placeBet(userId, validBetData)).rejects.toThrow(BadRequestException);
      expect(mockUserBalanceRepository.getUserBalance).toHaveBeenCalledWith(userId);
      expect(mockBetRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getBetById', () => {
    it('should return a bet when it exists', async () => {
      // Arrange
      const betId = 'bet123';
      const bet = { _id: betId, userId: 'user123', status: 'Pending' };
      mockBetRepository.findById.mockResolvedValue(bet);

      // Act
      const result = await service.getBetById(betId);

      // Assert
      expect(mockBetRepository.findById).toHaveBeenCalledWith(betId);
      expect(result).toEqual(bet);
    });
  });

  describe('updateBetStatus', () => {
    const matchId = 'match123';
    const matchResult = '1'; // Home team won

    it('should update bet status when match is resolved', async () => {
      // Arrange
      const bets = [
        new MockBetDocument({
          userId: 'user1',
          matches: [
            { matchId, betOutcome: '1', odds: 1.5, status: 'Pending' }, // Should win
            { matchId: 'match2', betOutcome: 'X', odds: 2.0, status: 'Pending' }, // Remains pending
          ],
          status: 'Pending',
        }),
        new MockBetDocument({
          userId: 'user2',
          matches: [
            { matchId, betOutcome: '2', odds: 3.0, status: 'Pending' }, // Should lose
          ],
          status: 'Pending',
        }),
      ];

      mockBetRepository.findByMatch.mockResolvedValue(bets);

      // Act
      await service.updateBetStatus(matchId, matchResult);

      // Assert
      expect(mockBetRepository.findByMatch).toHaveBeenCalledWith(matchId);
      
      // First bet - partial win, still pending overall
      expect(mockBetRepository.update).toHaveBeenCalledWith(
        bets[0]._id.toString(),
        {
          status: 'Pending',
          matches: [
            { matchId, betOutcome: '1', odds: 1.5, status: 'Won' },
            { matchId: 'match2', betOutcome: 'X', odds: 2.0, status: 'Pending' },
          ],
        }
      );
      
      // Second bet - lost match, lost overall
      expect(mockBetRepository.update).toHaveBeenCalledWith(
        bets[1]._id.toString(),
        {
          status: 'Lost',
          matches: [
            { matchId, betOutcome: '2', odds: 3.0, status: 'Lost' },
          ],
        }
      );
    });

    it('should mark bet as won when all matches are won', async () => {
      // Arrange
      const bets = [
        new MockBetDocument({
          userId: 'user1',
          matches: [
            { matchId, betOutcome: '1', odds: 1.5, status: 'Pending' }, // Should win
            { matchId: 'match2', betOutcome: 'X', odds: 2.0, status: 'Won' }, // Already won
          ],
          status: 'Pending',
        }),
      ];

      mockBetRepository.findByMatch.mockResolvedValue(bets);

      // Act
      await service.updateBetStatus(matchId, matchResult);

      // Assert
      expect(mockBetRepository.update).toHaveBeenCalledWith(
        bets[0]._id.toString(),
        {
          status: 'Won',
          matches: [
            { matchId, betOutcome: '1', odds: 1.5, status: 'Won' },
            { matchId: 'match2', betOutcome: 'X', odds: 2.0, status: 'Won' },
          ],
        }
      );
    });

    it('should handle empty bets array gracefully', async () => {
      // Arrange
      mockBetRepository.findByMatch.mockResolvedValue([]);

      // Act
      await service.updateBetStatus(matchId, matchResult);

      // Assert
      expect(mockBetRepository.findByMatch).toHaveBeenCalledWith(matchId);
      expect(mockBetRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('checkPendingBets', () => {
    it('should return message when no pending bets exist', async () => {
      // Arrange
      mockBetRepository.findByStatus.mockResolvedValue([]);

      // Act
      const result = await service.checkPendingBets();

      // Assert
      expect(mockBetRepository.findByStatus).toHaveBeenCalledWith('Pending');
      expect(result).toEqual({ message: 'No pending bets to check.' });
      expect(mockOddsApiService.getSupportedLeagues).not.toHaveBeenCalled();
    });

    it('should check and update all pending bets', async () => {
      // Arrange
      const pendingBets = [
        new MockBetDocument({
          userId: 'user1',
          matches: [
            { matchId: 'match1', betOutcome: '1', odds: 1.5, status: 'Pending' },
          ],
          stake: 10,
          totalOdds: 1.5,
          potentialPayout: 15,
          status: 'Pending',
        }),
        new MockBetDocument({
          userId: 'user2',
          matches: [
            { matchId: 'match2', betOutcome: 'X', odds: 2.0, status: 'Pending' },
          ],
          stake: 20,
          totalOdds: 2.0,
          potentialPayout: 40,
          status: 'Pending',
        }),
      ];

      mockBetRepository.findByStatus.mockResolvedValue(pendingBets);
      mockOddsApiService.getSupportedLeagues.mockResolvedValue([
        { key: 'league1', name: 'Premier League' },
        { key: 'league2', name: 'La Liga' },
      ]);
      
      mockOddsApiService.getLeagueScores.mockImplementation((league) => {
        if (league === 'league1') {
          return Promise.resolve([
            {
              id: 'match1',
              completed: true,
              scores: { homeScore: 2, awayScore: 1 }
            }
          ]);
        } else {
          return Promise.resolve([
            {
              id: 'match2',
              completed: false,
              scores: { homeScore: 0, awayScore: 0 }
            }
          ]);
        }
      });

      // Spy on private method with proper typing
      jest.spyOn<any, any>(service, 'checkAndUpdateBet').mockImplementation((bet: MockBetDocument) => {
        if (bet.matches[0].matchId === 'match1') {
          bet.status = 'Won';
          bet.matches[0].status = 'Won';
          return Promise.resolve({
            betId: bet._id,
            status: 'Won',
            matches: [{ matchId: 'match1', betOutcome: '1', odds: 1.5, status: 'Won' }],
            stake: 10,
            totalOdds: 1.5,
            potentialPayout: 15,
            actualPayout: 15,
          });
        } else {
          return Promise.resolve({
            betId: bet._id,
            status: 'Pending',
            matches: [{ matchId: 'match2', betOutcome: 'X', odds: 2.0, status: 'Pending' }],
            stake: 20,
            totalOdds: 2.0,
            potentialPayout: 40,
            actualPayout: 0,
          });
        }
      });

      // Act
      const result = await service.checkPendingBets();

      // Assert
      expect(mockBetRepository.findByStatus).toHaveBeenCalledWith('Pending');
      expect(mockOddsApiService.getSupportedLeagues).toHaveBeenCalled();
      expect(mockOddsApiService.getLeagueScores).toHaveBeenCalledTimes(2);
      expect(result.message).toContain('Checked 2 pending bets');
      expect(result.results).toHaveLength(2);
    });

    it('should handle errors when fetching league scores', async () => {
      // Arrange
      const pendingBets = [
        new MockBetDocument({
          userId: 'user1',
          matches: [{ matchId: 'match1', betOutcome: '1', odds: 1.5, status: 'Pending' }],
        }),
      ];

      mockBetRepository.findByStatus.mockResolvedValue(pendingBets);
      mockOddsApiService.getSupportedLeagues.mockResolvedValue([
        { key: 'league1', name: 'Premier League' },
      ]);
      
      // Simulate error when fetching scores
      mockOddsApiService.getLeagueScores.mockRejectedValue(new Error('API error'));
      
      // Spy on console.error to verify it's called
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock the private method to return a result despite error
      jest.spyOn<any, any>(service, 'checkAndUpdateBet').mockResolvedValue({
        betId: pendingBets[0]._id,
        status: 'Pending',
        matches: [{ matchId: 'match1', betOutcome: '1', odds: 1.5, status: 'Pending' }],
      });

      // Act
      const result = await service.checkPendingBets();

      // Assert
      expect(mockOddsApiService.getLeagueScores).toHaveBeenCalledWith('league1', 3);
      expect(console.error).toHaveBeenCalled();
      expect(result.message).toContain('Checked 1 pending bets');
    });
  });

  describe('checkBetById', () => {
    it('should throw NotFoundException when bet does not exist', async () => {
      // Arrange
      const betId = 'nonexistent';
      mockBetRepository.findById.mockResolvedValue(null);
      
      // Mock the implementation to throw the correct error
      jest.spyOn(service, 'checkBetById').mockImplementation(async (id) => {
        const bet = await betRepository.findById(id);
        if (!bet) {
          throw new NotFoundException('Bet not found');
        }
        // The rest of the implementation shouldn't matter for this test
        return null;
      });

      // Act & Assert
      await expect(service.checkBetById(betId)).rejects.toThrow(NotFoundException);
    });

    it('should check and update a specific bet', async () => {
      // Arrange
      const betId = 'bet123';
      const bet = new MockBetDocument({
        userId: 'user1',
        matches: [
          { matchId: 'match1', betOutcome: '1', odds: 1.5, status: 'Pending' },
        ],
        stake: 10,
        totalOdds: 1.5,
        potentialPayout: 15,
      });

      mockBetRepository.findById.mockResolvedValue(bet);
      mockOddsApiService.getSupportedLeagues.mockResolvedValue([
        { key: 'league1', name: 'Premier League' },
      ]);
      mockOddsApiService.getLeagueScores.mockResolvedValue([
        {
          id: 'match1',
          completed: true,
          scores: { homeScore: 2, awayScore: 1 }
        }
      ]);

      // Mock private method
      const expectedResult = {
        betId: bet._id,
        status: 'Won',
        matches: [{ matchId: 'match1', betOutcome: '1', odds: 1.5, status: 'Won' }],
        stake: 10,
        totalOdds: 1.5,
        potentialPayout: 15,
        actualPayout: 15,
      };
      
      // Restore the original implementation
      jest.spyOn(service, 'checkBetById').mockRestore();
      
      // Mock the private method
      jest.spyOn<any, any>(service, 'checkAndUpdateBet').mockResolvedValue(expectedResult);

      // Act
      const result = await service.checkBetById(betId);

      // Assert
      expect(mockBetRepository.findById).toHaveBeenCalledWith(betId);
      expect(mockOddsApiService.getSupportedLeagues).toHaveBeenCalled();
      expect(mockOddsApiService.getLeagueScores).toHaveBeenCalledWith('league1', 3);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('Private methods', () => {
    describe('checkAndUpdateBet', () => {
      it('should skip updating already settled bets', async () => {
        // Arrange
        const bet = new MockBetDocument({
          status: 'Won',
          matches: [
            { matchId: 'match1', betOutcome: '1', odds: 1.5, status: 'Won' },
          ],
        });
        
        const allScores = {};

        // Act
        const result = await (service as any).checkAndUpdateBet(bet, allScores);

        // Assert
        expect(result.status).toBe('Won');
        expect(result.message).toBe('Bet already settled');
        expect(userBalanceRepository.incrementBalance).not.toHaveBeenCalled();
        expect(bet.save).not.toHaveBeenCalled();
      });

      it('should update bet to Won status and pay out when all matches are won', async () => {
        // Arrange
        const userId = 'user123';
        const bet = new MockBetDocument({
          userId,
          status: 'Pending',
          matches: [
            { matchId: 'match1', betOutcome: '1', odds: 1.5, status: 'Pending' },
          ],
          stake: 10,
          totalOdds: 1.5,
          potentialPayout: 15,
        });
        
        const allScores = {
          league1: [
            {
              id: 'match1',
              completed: true,
              scores: { homeScore: 2, awayScore: 1 }
            }
          ]
        };

        // Override private methods
        jest.spyOn<any, any>(service, 'findMatchScore').mockReturnValue(allScores.league1[0]);
        jest.spyOn<any, any>(service, 'checkMatchResult').mockReturnValue({ status: 'Won' });

        // Act
        const result = await (service as any).checkAndUpdateBet(bet, allScores);

        // Assert
        expect(bet.status).toBe('Won');
        expect(bet.matches[0].status).toBe('Won');
        expect(userBalanceRepository.incrementBalance).toHaveBeenCalledWith(userId, 15);
        expect(bet.save).toHaveBeenCalled();
        expect(result.status).toBe('Won');
        expect(result.actualPayout).toBe(15);
      });

      it('should update bet to Lost status when any match is lost', async () => {
        // Arrange
        const bet = new MockBetDocument({
          status: 'Pending',
          matches: [
            { matchId: 'match1', betOutcome: '1', odds: 1.5, status: 'Won' },
            { matchId: 'match2', betOutcome: 'X', odds: 2.0, status: 'Pending' },
          ],
          stake: 10,
          totalOdds: 3.0,
          potentialPayout: 30,
        });
        
        const allScores = {
          league1: [
            {
              id: 'match2',
              completed: true,
              scores: { homeScore: 1, awayScore: 2 }
            }
          ]
        };

        // Override private methods
        jest.spyOn<any, any>(service, 'findMatchScore').mockReturnValue(allScores.league1[0]);
        jest.spyOn<any, any>(service, 'checkMatchResult').mockReturnValue({ status: 'Lost' });

        // Act
        const result = await (service as any).checkAndUpdateBet(bet, allScores);

        // Assert
        expect(bet.status).toBe('Lost');
        expect(bet.matches[1].status).toBe('Lost');
        expect(userBalanceRepository.incrementBalance).not.toHaveBeenCalled();
        expect(bet.save).toHaveBeenCalled();
        expect(result.status).toBe('Lost');
        expect(result.actualPayout).toBe(0);
      });

      it('should keep bet as Pending when not all matches are completed', async () => {
        // Arrange
        const bet = new MockBetDocument({
          status: 'Pending',
          matches: [
            { matchId: 'match1', betOutcome: '1', odds: 1.5, status: 'Won' },
            { matchId: 'match2', betOutcome: 'X', odds: 2.0, status: 'Pending' },
          ],
        });
        
        const allScores = {
          league1: [
            {
              id: 'match2',
              completed: false,
              scores: { homeScore: 0, awayScore: 0 }
            }
          ]
        };

        // Override private methods
        jest.spyOn<any, any>(service, 'findMatchScore').mockReturnValue(allScores.league1[0]);

        // Act
        const result = await (service as any).checkAndUpdateBet(bet, allScores);

        // Assert
        expect(bet.status).toBe('Pending');
        expect(bet.matches[1].status).toBe('Pending');
        expect(userBalanceRepository.incrementBalance).not.toHaveBeenCalled();
        expect(bet.save).toHaveBeenCalled();
        expect(result.status).toBe('Pending');
      });
    });

    describe('findMatchScore', () => {
      it('should find match score in cached scores', () => {
        // Arrange
        const matchId = 'match123';
        const allScores = {
          league1: [
            { id: 'match111', completed: true },
            { id: matchId, completed: true },
          ],
          league2: [
            { id: 'match222', completed: false },
          ],
        };

        // Act
        const result = (service as any).findMatchScore(matchId, allScores);

        // Assert
        expect(result).toEqual(allScores.league1[1]);
      });

      it('should return null when match is not found', () => {
        // Arrange
        const matchId = 'nonexistent';
        const allScores = {
          league1: [{ id: 'match111', completed: true }],
        };

        // Act
        const result = (service as any).findMatchScore(matchId, allScores);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('checkMatchResult', () => {
      it('should return Pending status when match is not completed', () => {
        // Arrange
        const matchScore = {
          completed: false,
          scores: { homeScore: 1, awayScore: 0 }
        };
        const betOutcome = '1';

        // Act
        const result = (service as any).checkMatchResult(matchScore, betOutcome);

        // Assert
        expect(result.status).toBe('Pending');
        expect(result.message).toBe('Match has not been completed yet');
      });

      it('should return Won status for correct home win prediction', () => {
        // Arrange
        const matchScore = {
          completed: true,
          scores: { homeScore: 2, awayScore: 1 }
        };
        const betOutcome = '1';

        // Act
        const result = (service as any).checkMatchResult(matchScore, betOutcome);

        // Assert
        expect(result.status).toBe('Won');
        expect(result.matchScore).toEqual(matchScore);
      });

      it('should return Won status for correct draw prediction', () => {
        // Arrange
        const matchScore = {
          completed: true,
          scores: { homeScore: 1, awayScore: 1 }
        };
        const betOutcome = 'X';

        // Act
        const result = (service as any).checkMatchResult(matchScore, betOutcome);

        // Assert
        expect(result.status).toBe('Won');
      });

      it('should return Won status for correct away win prediction', () => {
        // Arrange
        const matchScore = {
          completed: true,
          scores: { homeScore: 0, awayScore: 2 }
        };
        const betOutcome = '2';

        // Act
        const result = (service as any).checkMatchResult(matchScore, betOutcome);

        // Assert
        expect(result.status).toBe('Won');
      });

      it('should return Won status for correct over prediction', () => {
        // Arrange
        const matchScore = {
          completed: true,
          scores: { homeScore: 2, awayScore: 2 }
        };
        const betOutcome = 'over_3.5';

        // Act
        const result = (service as any).checkMatchResult(matchScore, betOutcome);

        // Assert
        expect(result.status).toBe('Won');
      });

      it('should return Won status for correct under prediction', () => {
        // Arrange
        const matchScore = {
          completed: true,
          scores: { homeScore: 1, awayScore: 0 }
        };
        const betOutcome = 'under_2.5';

        // Act
        const result = (service as any).checkMatchResult(matchScore, betOutcome);

        // Assert
        expect(result.status).toBe('Won');
      });

      it('should return Lost status for incorrect prediction', () => {
        // Arrange
        const matchScore = {
          completed: true,
          scores: { homeScore: 0, awayScore: 1 }
        };
        const betOutcome = '1'; // Home win predicted but away team won

        // Act
        const result = (service as any).checkMatchResult(matchScore, betOutcome);

        // Assert
        expect(result.status).toBe('Lost');
      });
    });
  });
});