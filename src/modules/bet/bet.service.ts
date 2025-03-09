import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BetRepository } from './bet.repository';
import { Bet, BetDocument } from './bet.schema';

@Injectable()
export class BetService {
  constructor(private readonly betRepository: BetRepository) {}

  // Place a bet
  async placeBet(userId: string, betData: { stake: number; matches: { matchId: string; betOutcome: string; odds: number }[] }) {    // Validation
    if (!userId) throw new BadRequestException('User ID is required');
    if (!betData.matches || betData.matches.length === 0) throw new BadRequestException('At least one match is required');
    if (betData.stake <= 1) throw new BadRequestException('Stake must be greater than zero');
    
    // Compute total odds
    const totalOdds = betData.matches.reduce((acc, match) => acc * match.odds, 1);

    // Compute potential payout
    const potentialPayout = betData.stake * totalOdds;

    const bet = await this.betRepository.create({
      userId,
      matches: betData.matches.map(match => ({
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
  async getBetById(betId:string): Promise<Bet>{
    const bet = this.betRepository.findById(betId);
    if(!bet) throw new NotFoundException('Bet not found');
    return bet;
  }

  // Update Bet Status 
  async updateBetStatus(matchId: string, matchResult: string):Promise<void> {
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
        matches: bet.matches 
      });
    }
  }
}