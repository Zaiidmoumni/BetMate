import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import gamesReducer from './slices/gamesSlice';
import betSlipReducer from './slices/bettingSlipSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        games: gamesReducer,
        betSlip: betSlipReducer
    }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;