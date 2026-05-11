import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';

export interface BetMatch {
  matchId: string;
  betOutcome: string;
  odds: number;
  matchName?: string;
}

interface BetSlipState {
  bets: BetMatch[];
  isOpen: boolean;
}

const initialState: BetSlipState = {
  bets: [],
  isOpen: false
};

export const betSlipSlice = createSlice({
  name: 'betSlip',
  initialState,
  reducers: {
    addBet: (state, action: PayloadAction<BetMatch>) => {
      // Check if match already exists in bet slip
      const existingBetIndex = state.bets.findIndex(bet => bet.matchId === action.payload.matchId);
      
      if (existingBetIndex !== -1) {
        // Update existing bet with new selection
        state.bets[existingBetIndex] = action.payload;
      } else {
        // Add new bet to slip
        state.bets.push(action.payload);
      }
    },
    removeBet: (state, action: PayloadAction<string>) => {
      state.bets = state.bets.filter(bet => bet.matchId !== action.payload);
    },
    clearBets: (state) => {
      state.bets = [];
    },
    toggleBetSlip: (state) => {
      state.isOpen = !state.isOpen;
    },
    setBetSlipOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    }
  }
});

// Export actions
export const { addBet, removeBet, clearBets, toggleBetSlip, setBetSlipOpen } = betSlipSlice.actions;

// Export selectors
export const selectBets = (state: RootState) => state.betSlip.bets;
export const selectBetSlipOpen = (state: RootState) => state.betSlip.isOpen;
export const selectBetCount = (state: RootState) => state.betSlip.bets.length;

export default betSlipSlice.reducer;