// Environment variable configurations imported from Vite environment variables
export const ENV = {
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api') as string,
  WS_URL: (import.meta.env.VITE_WS_URL || 'ws://localhost:4000') as string,
  APP_ENV: (import.meta.env.VITE_APP_ENV || 'development') as 'development' | 'production',
}
