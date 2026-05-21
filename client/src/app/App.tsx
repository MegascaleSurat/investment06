// Root component initializing providers including TanStack Query and RouterProvider
import React, { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import router from './Router'
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuthStore } from '../store/useAuthStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  const { initialize, isLoading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F19] text-slate-200 font-sans">
        <div className="relative flex items-center justify-center">
          {/* Animated pulsing outer rings */}
          <div className="absolute h-16 w-16 animate-ping rounded-full border border-sky-500/30 opacity-75 animate-duration-3000"></div>
          <div className="absolute h-24 w-24 animate-pulse rounded-full border border-indigo-500/20"></div>
          
          {/* Centered logo icon or spinner */}
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 shadow-lg shadow-sky-500/20">
            <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
        <h3 className="mt-8 text-sm font-medium uppercase tracking-widest text-slate-400">Zero Thinking</h3>
        <p className="mt-1.5 text-xs text-slate-500">Restoring administrative terminal session...</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </TooltipProvider>
  )
}
export default App
