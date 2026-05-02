import { Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"

import type { RootState } from "@/app/store"

export default function AdminRoute() {
  const { token, user } = useSelector((s: RootState) => s.auth)

  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== "ADMIN") return <Navigate to="/dashboard" replace />
  return <Outlet />
}
