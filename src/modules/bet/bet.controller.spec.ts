import { Test, TestingModule } from '@nestjs/testing';
import { BetController } from './bet.controller';
import { BetService } from './bet.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { AccessTokenGuard } from '@/guards/accessToken.guard';

// Mock the BetService
const mockBetService = {
  placeBet: jest.fn(),
  getBetById: jest.fn(),
  checkBetById: jest.fn(),
  checkPendingBets: jest.fn(),
};

// Mock AccessTokenGuard
const mockAccessTokenGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('BetController', () => {
  let controller: BetController;
  let service: BetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BetController],
      providers: [
        {
          provide: BetService,
          useValue: mockBetService,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue(mockAccessTokenGuard)
      .compile();

    controller = module.get<BetController>(BetController);
    service = module.get<BetService>(BetService);

    // Reset mock calls before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('placeBet', () => {
    it('should call betService.placeBet with correct parameters', async () => {
      // Arrange
      const userId = 'test-user-id';
      const createBetDto: CreateBetDto = {
        stake: 100,
        matches: [
          { matchId: 'match-123', betOutcome: 'HOME_WIN', odds: 2.5 },
          { matchId: 'match-456', betOutcome: 'DRAW', odds: 3.2 }
        ]
      };
      const req = { user: { userId } };
      const expectedResult = { 
        id: 'bet-789', 
        userId, 
        stake: createBetDto.stake, 
        matches: createBetDto.matches,
        status: 'PENDING',
        potentialWinnings: 800, // Example value
        createdAt: new Date()
      };
      
      mockBetService.placeBet.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.placeBet(createBetDto, req);

      // Assert
      expect(service.placeBet).toHaveBeenCalledWith(userId, createBetDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw an error if betService.placeBet throws', async () => {
      // Arrange
      const userId = 'test-user-id';
      const createBetDto: CreateBetDto = {
        stake: 100,
        matches: [
          { matchId: 'match-123', betOutcome: 'HOME_WIN', odds: 2.5 }
        ]
      };
      const req = { user: { userId } };
      const errorMessage = 'Insufficient funds';
      
      mockBetService.placeBet.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.placeBet(createBetDto, req)).rejects.toThrow(errorMessage);
      expect(service.placeBet).toHaveBeenCalledWith(userId, createBetDto);
    });

    it('should validate bet data when placing bet', async () => {
      // This test is more about integration with class-validator
      // In a real scenario, NestJS would handle validation before controller method is called
      // But we can still test the structure matches what we expect
      
      const userId = 'test-user-id';
      const validCreateBetDto: CreateBetDto = {
        stake: 100,
        matches: [
          { matchId: 'match-123', betOutcome: 'HOME_WIN', odds: 2.5 }
        ]
      };
      const req = { user: { userId } };
      
      mockBetService.placeBet.mockResolvedValue({ id: 'new-bet-id' });
      
      await controller.placeBet(validCreateBetDto, req);
      
      expect(service.placeBet).toHaveBeenCalledWith(userId, expect.objectContaining({
        stake: expect.any(Number),
        matches: expect.arrayContaining([
          expect.objectContaining({
            matchId: expect.any(String),
            betOutcome: expect.any(String),
            odds: expect.any(Number)
          })
        ])
      }));
    });
  });

  describe('getBetById', () => {
    it('should call betService.getBetById with correct betId', async () => {
      // Arrange
      const betId = 'bet-123';
      const expectedBet = { 
        id: betId, 
        userId: 'user-456', 
        stake: 50,
        matches: [
          { matchId: 'match-789', betOutcome: 'AWAY_WIN', odds: 1.8 }
        ],
        status: 'PENDING',
        potentialWinnings: 90,
        createdAt: new Date()
      };
      
      mockBetService.getBetById.mockResolvedValue(expectedBet);

      // Act
      const result = await controller.getBetById(betId);

      // Assert
      expect(service.getBetById).toHaveBeenCalledWith(betId);
      expect(result).toEqual(expectedBet);
    });

    it('should throw an error if betService.getBetById throws', async () => {
      // Arrange
      const betId = 'non-existent-bet';
      const errorMessage = 'Bet not found';
      
      mockBetService.getBetById.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.getBetById(betId)).rejects.toThrow(errorMessage);
      expect(service.getBetById).toHaveBeenCalledWith(betId);
    });
  });

  describe('checkBetById', () => {
    it('should call betService.checkBetById with correct betId', async () => {
      // Arrange
      const betId = 'bet-123';
      const expectedResult = { 
        id: betId, 
        status: 'WON', 
        winnings: 250,
        matches: [
          { 
            matchId: 'match-123', 
            betOutcome: 'HOME_WIN', 
            odds: 2.5,
            result: 'HOME_WIN',
            isWinner: true
          }
        ]
      };
      
      mockBetService.checkBetById.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.checkBetById(betId);

      // Assert
      expect(service.checkBetById).toHaveBeenCalledWith(betId);
      expect(result).toEqual(expectedResult);
    });

    it('should throw an error if betService.checkBetById throws', async () => {
      // Arrange
      const betId = 'invalid-bet';
      const errorMessage = 'Cannot check bet status';
      
      mockBetService.checkBetById.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.checkBetById(betId)).rejects.toThrow(errorMessage);
      expect(service.checkBetById).toHaveBeenCalledWith(betId);
    });
  });

  describe('checkAllBets', () => {
    it('should call betService.checkPendingBets', async () => {
      // Arrange
      const expectedResult = {
        processed: 10,
        won: 3,
        lost: 7,
        totalWinningsPaid: 1250
      };
      
      mockBetService.checkPendingBets.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.checkAllBets();

      // Assert
      expect(service.checkPendingBets).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should throw an error if betService.checkPendingBets throws', async () => {
      // Arrange
      const errorMessage = 'Failed to process pending bets';
      
      mockBetService.checkPendingBets.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.checkAllBets()).rejects.toThrow(errorMessage);
      expect(service.checkPendingBets).toHaveBeenCalled();
    });
  });
});