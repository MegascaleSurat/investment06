// Rule engine validators for validating market entry and exit triggers
import { MarketStatus, SectorStatus, TradeStatus } from '../types/enums'

export function checkPriceAboveEntry(ltp: number, entryPrice: number): boolean {
  return ltp > entryPrice;
}

export function checkVolumeRatio(volumeRatio: number, minRatio?: number): boolean {
  return volumeRatio >= (minRatio ?? 1.5);
}

export function checkSectorStrong(sectorStatus: SectorStatus): boolean {
  return sectorStatus === SectorStatus.STRONG || sectorStatus === SectorStatus.VERY_STRONG;
}

export function checkMarketNotWeak(marketStatus: MarketStatus): boolean {
  return marketStatus !== MarketStatus.WEAK;
}

export function checkWeakMarketException(
  outperformancePct: number,
  breadthPct: number,
  volumeRatio: number
): boolean {
  return outperformancePct >= 2.0 && breadthPct >= 60 && volumeRatio >= 2.0;
}

export function checkDuplicateTrade(openStatuses: TradeStatus[]): boolean {
  const activeStatuses = [
    TradeStatus.ACTIVE,
    TradeStatus.TRAILING,
    TradeStatus.ORDER_PLACED,
    TradeStatus.WAITING_CONFIRMATION,
    TradeStatus.READY
  ];
  return openStatuses.some((status) => activeStatuses.includes(status));
}

export function checkStopLossHit(currentPrice: number, stopLoss: number): boolean {
  return currentPrice <= stopLoss;
}

export function checkNoMovementExit(priceHistory: number[], days: number, rangePct: number): boolean {
  if (!priceHistory || priceHistory.length < days || priceHistory.length === 0) return false;
  const targetPrices = priceHistory.slice(-days);
  const min = Math.min(...targetPrices);
  const max = Math.max(...targetPrices);
  if (min === 0) return false;
  const spreadPct = ((max - min) / min) * 100;
  return spreadPct < rangePct;
}

export function checkVolumeWeaknessExit(volumeRatios: number[]): boolean {
  if (!volumeRatios || volumeRatios.length < 3) return false;
  // If the last 3 volume ratios are below 0.5, trigger exit
  return volumeRatios.slice(-3).every((ratio) => ratio < 0.5);
}
