import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit"

import authReducer from "@/app/authSlice"

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

export const { toggleSidebar, setTheme } = uiSlice.actions;

export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
