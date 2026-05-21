// Financial and volume metrics calculations for automated trade indicators
// Price change percentage
export function calcPriceChangePct(ltp: number, prevClose: number): number {
  if (!prevClose) return 0;
  return ((ltp - prevClose) / prevClose) * 100;
}

// Average 10-day volume
export function calcAvg10dVolume(volumes: number[]): number {
  if (!volumes || volumes.length === 0) return 0;
  return volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
}

// Volume ratio
export function calcVolumeRatio(todayVolume: number, avg10dVolume: number): number {
  if (!avg10dVolume) return 0;
  return todayVolume / avg10dVolume;
}

// Sector return
export function calcSectorReturn(priceChangePcts: number[]): number {
  if (!priceChangePcts || priceChangePcts.length === 0) return 0;
  return priceChangePcts.reduce((sum, pct) => sum + pct, 0) / priceChangePcts.length;
}

// Breadth percentage
export function calcBreadthPct(positiveCount: number, totalCount: number): number {
  if (!totalCount) return 0;
  return (positiveCount / totalCount) * 100;
}

// Outperformance
export function calcOutperformance(sectorReturn: number, marketReturn: number): number {
  return sectorReturn - marketReturn;
}

// PnL percentage
export function calcPnlPct(currentPrice: number, entryPrice: number): number {
  if (!entryPrice) return 0;
  return ((currentPrice - entryPrice) / entryPrice) * 100;
}

// Trailing SL after step move
export function calcTrailingStopLoss(entryPrice: number, currentPrice: number, stepPercent: number): number {
  if (!entryPrice || stepPercent <= 0) return 0;
  const stepAmount = entryPrice * (stepPercent / 100);
  if (currentPrice < entryPrice) return entryPrice - stepAmount;
  const stepsMoved = Math.floor((currentPrice - entryPrice) / stepAmount);
  if (stepsMoved <= 0) return entryPrice - stepAmount;
  // Move stop loss up by the steps moved
  return entryPrice + (stepsMoved - 1) * stepAmount;
}

// Should move SL to entry (no-loss trigger at +5%)
export function shouldMoveSLToEntry(pnlPct: number): boolean {
  return pnlPct >= 5;
}

// Slot volume ratio (15-min same-time comparison)
export function calcSlotVolumeRatio(currentSlotVolume: number, avg10dSameSlotVolume: number): number {
  if (!avg10dSameSlotVolume) return 0;
  return currentSlotVolume / avg10dSameSlotVolume;
}

// Cumulative volume ratio
export function calcCumulativeVolumeRatio(todayCumVolume: number, expectedCumVolume: number): number {
  if (!expectedCumVolume) return 0;
  return todayCumVolume / expectedCumVolume;
}
