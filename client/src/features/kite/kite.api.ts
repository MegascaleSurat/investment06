export const kiteKeys = {
  all: ["kite"] as const,
  status: () => [...kiteKeys.all, "status"] as const,
  profile: () => [...kiteKeys.all, "profile"] as const,
} as const

