import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  _id: string;
  email: string;
  name: string;
  balance: number;
  isVerified: boolean;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action: PayloadAction<{ user: Partial<User>; accessToken: string }>) {
      const { user, accessToken } = action.payload;
      state.isAuthenticated = true;
      state.user = user as User; // This might be a partial user object during initial login
      state.token = accessToken;
      // Persist to localStorage
      localStorage.setItem("auth", JSON.stringify({ user, accessToken }));
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      // clear localStorage
      localStorage.removeItem("auth");
    },
    hydrate(state) {
      const storedAuth = localStorage.getItem("auth");
      if (storedAuth) {
        const { user, accessToken } = JSON.parse(storedAuth);
        state.isAuthenticated = true;
        state.user = user;
        state.token = accessToken;
      }
    },
    // Updated to match full user profile from API
    updateUserProfile(state, action: PayloadAction<User>) {
      state.user = action.payload;
      
      // Update localStorage with the new user data
      if (state.token) {
        localStorage.setItem("auth", JSON.stringify({ 
          user: action.payload, 
          accessToken: state.token 
        }));
      }
    },
  },
});

export const { login, logout, hydrate, updateUserProfile } = authSlice.actions;

export default authSlice.reducer;