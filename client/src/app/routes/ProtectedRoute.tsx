import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"

import type { RootState } from "@/app/store"

export default function ProtectedRoute() {
  const token = useSelector((s: RootState) => s.auth.token)
  const location = useLocation()

  if (!token) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
