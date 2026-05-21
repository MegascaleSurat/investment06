// Zustand global store for managing system notifications and trade alerts
import { create } from 'zustand'
import { AlertType } from '../types/enums'

export interface Alert {
  id: string
  message: string
  type: AlertType
  seen: boolean
  timestamp: string
}

interface AlertStore {
  alerts: Alert[]
  addAlert: (alert: Alert) => void
  markSeen: (id: string) => void
  clearAll: () => void
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
  markSeen: (id) => set((state) => ({
    alerts: state.alerts.map((a) => (a.id === id ? { ...a, seen: true } : a)),
  })),
  clearAll: () => set({ alerts: [] }),
}))
