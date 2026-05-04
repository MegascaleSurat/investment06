import Decimal from 'decimal.js';

/**
 * Calculates price change percentage
 * @param {number} ltp 
 * @param {number} prevClose 
 * @returns {number}
 */
export const calcPriceChangePct = (ltp, prevClose) => {
  if (!prevClose) return 0;
  return new Decimal(ltp).minus(prevClose).div(prevClose).mul(100).toNumber();
};

/**
 * Calculates volume ratio
 * @param {number} todayVol 
 * @param {number} avg10dVol 
 * @returns {number}
 */
export const calcVolumeRatio = (todayVol, avg10dVol) => {
  if (!avg10dVol) return 0;
  return new Decimal(todayVol).div(avg10dVol).toNumber();
};

/**
 * Calculates average of 10-day volume
 * @param {number[]} volumes 
 * @returns {number}
 */
export const calcAvg10dVolume = (volumes) => {
  if (!volumes || volumes.length === 0) return 0;
  const sum = volumes.reduce((acc, vol) => acc.plus(vol), new Decimal(0));
  return sum.div(volumes.length).toNumber();
};

/**
 * Calculates sector return (average of price change percentages)
 * @param {number[]} priceChanges 
 * @returns {number}
 */
export const calcSectorReturn = (priceChanges) => {
  if (!priceChanges || priceChanges.length === 0) return 0;
  const sum = priceChanges.reduce((acc, pc) => acc.plus(pc), new Decimal(0));
  return sum.div(priceChanges.length).toNumber();
};

/**
 * Calculates breadth percentage
 * @param {number} positiveCount 
 * @param {number} totalCount 
 * @returns {number}
 */
export const calcBreadthPct = (positiveCount, totalCount) => {
  if (!totalCount) return 0;
  return new Decimal(positiveCount).div(totalCount).mul(100).toNumber();
};

/**
 * Calculates outperformance
 * @param {number} sectorReturn 
 * @param {number} marketReturn 
 * @returns {number}
 */
export const calcOutperformance = (sectorReturn, marketReturn) => {
  return new Decimal(sectorReturn).minus(marketReturn).toNumber();
};

/**
 * Calculates PnL percentage
 * @param {number} currentPrice 
 * @param {number} entryPrice 
 * @returns {number}
 */
export const calcPnlPct = (currentPrice, entryPrice) => {
  if (!entryPrice) return 0;
  return new Decimal(currentPrice).minus(entryPrice).div(entryPrice).mul(100).toNumber();
};
