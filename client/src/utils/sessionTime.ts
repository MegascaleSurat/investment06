// Market session determination and threshold parameters based on operational hours
import { MarketSession } from '../types/enums'

export function getCurrentSession(now: Date): MarketSession {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const time = hours * 100 + minutes;
  
  if (time < 1030) {
    return MarketSession.OPENING;
  } else if (time < 1430) {
    return MarketSession.MID;
  } else {
    return MarketSession.CLOSING;
  }
}

export function isMarketOpen(now: Date): boolean {
  const day = now.getDay();
  // Sunday = 0, Saturday = 6
  if (day === 0 || day === 6) return false;
  
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const time = hours * 100 + minutes;
  
  // Market hours: 09:15 to 15:30
  return time >= 915 && time <= 1530;
}

export function getSessionThresholds(session: MarketSession): { slotRatio: number; cumRatio: number } {
  switch (session) {
    case MarketSession.OPENING:
      return { slotRatio: 2.0, cumRatio: 1.8 };
    case MarketSession.MID:
      return { slotRatio: 1.2, cumRatio: 1.0 };
    case MarketSession.CLOSING:
      return { slotRatio: 1.5, cumRatio: 1.3 };
    default:
      return { slotRatio: 1.0, cumRatio: 1.0 };
  }
}
