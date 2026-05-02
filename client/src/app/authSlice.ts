import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { decodeJwtPayload } from "@/utils/jwt"

export type AuthUser = {
  id: string
  email: string
  role: "ADMIN" | "USER" | "SUB_ADMIN"
}

export type AuthState = {
  user: AuthUser | null
  token: string | null
}

const token = localStorage.getItem("token")
const payload = token
  ? decodeJwtPayload<{ sub?: string; email?: string; roles?: AuthUser["role"] }>(token)
  : null

const initialState: AuthState = {
  user: payload?.sub ? { id: payload.sub, email: payload.email ?? "", role: payload.roles ?? "USER" } : null,
  token,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: AuthUser | null; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      localStorage.setItem("token", action.payload.token)
    },
    logout: (state) => {
      state.user = null
      state.token = null
      localStorage.removeItem("token")
    },
  },
})

export const { setAuth, logout } = authSlice.actions
export default authSlice.reducer
