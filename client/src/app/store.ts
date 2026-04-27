import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

// UI State Slice
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

const initialUIState: UIState = {
  sidebarOpen: true,
  theme: 'dark',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUIState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
  },
});

// Auth State Slice
interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialAuthState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: any; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
  },
});

export const { toggleSidebar, setTheme } = uiSlice.actions;
export const { setCredentials, logout } = authSlice.actions;

export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    auth: authSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
