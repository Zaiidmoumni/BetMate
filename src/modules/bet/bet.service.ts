import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BetRepository } from './bet.repository';
import { Bet, BetDocument } from './bet.schema';
import { OddsApiService } from '../odds-api/odds-api.service';

@Injectable()
export class BetService {
  constructor(
    private readonly betRepository: BetRepository,
    private readonly oddsApiService: OddsApiService,
  ) {}

  // Place a bet
  async placeBet(
    userId: string,
    betData: {
      stake: number;
      matches: { matchId: string; betOutcome: string; odds: number }[];
    },
  ) {
    // Validation
    if (!userId) throw new BadRequestException('User ID is required');
    if (!betData.matches || betData.matches.length === 0)
      throw new BadRequestException('At least one match is required');
    if (betData.stake <= 1)
      throw new BadRequestException('Stake must be greater than zero');

    // Compute total odds
    const totalOdds = betData.matches.reduce(
      (acc, match) => acc * match.odds,
      1,
    );

    // Compute potential payout
    const potentialPayout = betData.stake * totalOdds;

    const bet = await this.betRepository.create({
      userId,
      matches: betData.matches.map((match) => ({
        matchId: match.matchId,
        betOutcome: match.betOutcome,
        odds: match.odds,
        status: 'Pending',
      })),
      totalOdds,
      stake: betData.stake,
      potentialPayout,
      status: 'Pending',
    });

    return bet;
  }

  // Find a bet
  async getBetById(betId: string): Promise<Bet> {
    const bet = this.betRepository.findById(betId);
    if (!bet) throw new NotFoundException('Bet not found');
    return bet;
  }

  // Update Bet Status
  async updateBetStatus(matchId: string, matchResult: string): Promise<void> {
    const bets: BetDocument[] = await this.betRepository.findByMatch(matchId);

    for (const bet of bets) {
      let allResolved = true;
      let betWon = true;

      bet.matches.forEach((match) => {
        if (match.matchId === matchId) {
          match.status = match.betOutcome === matchResult ? 'Won' : 'Lost';
        }
        if (match.status === 'Pending') allResolved = false;
        if (match.status === 'Lost') betWon = false;
      });

      bet.status = allResolved ? (betWon ? 'Won' : 'Lost') : 'Pending';

      await this.betRepository.update(bet._id.toString(), {
        status: bet.status,
        matches: bet.matches,
      });
    }
  }

  // Check all pending bets
  async checkPendingBets() {
    try {
      // Get all pending bets
      const pendingBets = await this.betRepository.findByStatus('Pending');

      if (pendingBets.length === 0) {
        return { message: 'No pending bets to check.' };
      }

      // Get all scores from each supported league
      const supportedLeagues = await this.oddsApiService.getSupportedLeagues();
      const allScores = {};
      for (const league of supportedLeagues) {
        try {
          const scores = await this.oddsApiService.getLeagueScores(
            league.key,
            3,
          );
          allScores[league.key] = scores;
        } catch (error) {
          console.error(
            `Failed to fetch scores for league ${league.key}:`,
            error,
          );
        }
      }

      // Process each pendiing bet
      const updateResults = [];
      for (const bet of pendingBets) {
        const result = await this.checkAndUpdateBet(bet, allScores);
        updateResults.push(result);
      }

      return {
        message: `Checked ${updateResults.length} pending bets.`,
        results: updateResults,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to check pending bets: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Check a single bet
  async checkBetById(betId: string) {
    try {
      const bet = await this.betRepository.findById(betId);

      if(!bet){
        throw new NotFoundException('Bet not found');
      }

      // Get all scores from each supported league
      const supportedLeagues = await this.oddsApiService.getSupportedLeagues();
      const allScores = {};
      for (const league of supportedLeagues) {
        try {
          const scores = await this.oddsApiService.getLeagueScores(
            league.key,
            3,
          );
          allScores[league.key] = scores;
        } catch (error) {
          console.error(
            `Failed to fetch scores for league ${league.key}:`,
            error,
          );
        }
      }

      return await this.checkAndUpdateBet(bet, allScores);
    } catch (error) {
      throw new HttpException(
        `Failed to check bet: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  /*
   * Helper Methods
   * These methods are used to check and update bets
   */

  // Check and update a single bet's status
  private async checkAndUpdateBet(bet: BetDocument, allScores) {
    // Skip if not pending
    if (bet.status !== 'Pending') {
      return {
        betId: bet._id,
        status: bet.status,
        message: 'Bet already settled',
      };
    }

    //Check each match in the bet
    let allMatchesCimpleted = true;
    let allMatchesWon = true;

    // Update the status of each match
    for (const match of bet.matches) {
      // Skip if already determined
      if (match.status !== 'Pending') {
        if (match.status === 'Lost') {
          allMatchesWon = false;
        }
        continue;
      }

      // Find the match in our cached scores
      const matchScore = this.findMatchScore(match.matchId, allScores);

      // If match not found or not completed, keep as pending
      if (!matchScore || !matchScore.completed) {
        allMatchesCimpleted = false;
        continue;
      }

      //Check the match results
      const result = this.checkMatchResult(matchScore, match.betOutcome);
      match.status = result.status;

      if (match.status === 'Lost') {
        allMatchesWon = false;
      }
    }

    // Update the overall bet status
    if (allMatchesCimpleted) {
      bet.status = allMatchesWon ? 'Won' : 'Lost';
    }

    await bet.save();
    return {
      betId: bet._id,
      status: bet.status,
      matches: bet.matches.map((m) => ({
        matchId: m.matchId,
        betOutcome: m.betOutcome,
        odds: m.odds,
        status: m.status,
      })),
      stake: bet.stake,
      totalOdds: bet.totalOdds,
      potentialPayout: bet.potentialPayout,
      actualPayout: bet.status === 'Won' ? bet.potentialPayout : 0,
    };
  }
  // Find match score in cached score data
  private findMatchScore(matchId: string, allScores) {
    for (const leagueKey in allScores) {
      const match = allScores[leagueKey].find((match) => match.id === matchId);
      if (match) {
        return match;
      }
    }
    return null;
  }

  // Check a single match results
  private checkMatchResult(matchScore, betOutcome): { status: 'Pending' | 'Won' | 'Lost', message?: string, matchScore?: any } {
    if (!matchScore || !matchScore.completed) {
      return {
        status: 'Pending',
        message: 'Match has not been completed yet',
      };
    }
  
    const homeScore = matchScore.scores.homeScore;
    const awayScore = matchScore.scores.awayScore;
    let status: 'Won' | 'Lost' = 'Lost';
  
    // Parse betOutcome (format: "1", "X", "2", "over_..", "under_..".)
    if (betOutcome === '1' && homeScore > awayScore) {
      status = 'Won'; // Home win
    } else if (betOutcome === 'X' && homeScore === awayScore) {
      status = 'Won'; // Draw
    } else if (betOutcome === '2' && homeScore < awayScore) {
      status = 'Won'; // Away win
    } else if (betOutcome.startsWith('over_')) {
      const line = parseFloat(betOutcome.replace('over_', ''));
      if (homeScore + awayScore > line) {
        status = 'Won';
      }
    } else if (betOutcome.startsWith('under_')) {
      const line = parseFloat(betOutcome.replace('under_', ''));
      if (homeScore + awayScore < line) {
        status = 'Won';
      }
    }

    return {
      status,
      matchScore,
    };
  }
}
