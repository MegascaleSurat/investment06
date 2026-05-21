export interface RootState {
  ui: {
    sidebarOpen: boolean
  }
}

export function toggleSidebar() {
  return { type: 'TOGGLE_SIDEBAR' }
}
