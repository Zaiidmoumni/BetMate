// src/store/slices/gamesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchMatches } from '@/services/EventsService';

// Define match types
export interface Match {
  id: string;
  league: {
    key: string;
    title: string;
  };
  match: {
    commenceTime: string;
    homeTeam: string;
    awayTeam: string;
    displayName: string;
  };
  odds: {
    provider: {
      name: string;
      lastUpdate: string;
    };
    homeWin: number | null;
    awayWin: number | null;
    draw: number | null;
    overUnder: {
      point: number | null;
      over: number | null;
      under: number | null;
    } | null;
  };
}

interface MatchesState {
  items: Match[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastFetched: string | null;
}

const initialState: MatchesState = {
  items: [],
  status: 'idle',
  error: null,
  lastFetched: null,
};

// Create async thunk for fetching matches
export const fetchAllMatches = createAsyncThunk(
  'matches/fetchAllMatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchMatches();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch matches');
    }
  }
);

// Create the slice
const gamesSlice = createSlice({
  name: 'games',
  initialState,
  reducers: {
    clearMatches: (state) => {
      state.items = [];
      state.lastFetched = null;
    },
    
    // Add this reducer to refresh matches if needed
    refreshMatches: (state) => {
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllMatches.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllMatches.fulfilled, (state, action: PayloadAction<Match[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.lastFetched = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchAllMatches.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'Unknown error occurred';
      });
  },
});

// Export actions and reducer
export const { clearMatches, refreshMatches } = gamesSlice.actions;
export default gamesSlice.reducer;

// Selectors
export const selectAllMatches = (state: { games: MatchesState }) => state.games.items;
export const selectMatchesStatus = (state: { games: MatchesState }) => state.games.status;
export const selectMatchesError = (state: { games: MatchesState }) => state.games.error;
export const selectMatchById = (state: { games: MatchesState }, matchId: string) => 
  state.games.items.find(match => match.id === matchId);
export const selectMatchesByLeague = (state: { games: MatchesState }, leagueKey: string) => 
  state.games.items.filter(match => match.league.key === leagueKey);