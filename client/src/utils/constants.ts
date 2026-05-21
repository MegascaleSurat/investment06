// Constants and fallback configurations for calculation bounds and limits
export const CONSTANTS = {
  DEFAULT_STOP_LOSS_PCT: 5,
  DEFAULT_TARGET_PCT: 10,
  NO_MOVEMENT_DAYS: 3,
  NO_MOVEMENT_RANGE_PCT: 1.0,
  MAX_WS_RECONNECT_ATTEMPTS: 5,
  WS_RECONNECT_DELAY_MS: 1000,
} as const
