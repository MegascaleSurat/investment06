// Market status indicator banner displaying strength messages
import React from 'react'
import { MarketStatus } from '../../types/enums'
import AlertBanner from '../../components/ui/AlertBanner'

interface MarketStatusBannerProps {
  status: MarketStatus
}

export function MarketStatusBanner({ status }: MarketStatusBannerProps) {
  const getBannerMessage = (s: MarketStatus) => {
    switch (s) {
      case MarketStatus.STRONG:
        return 'Market environment is STRONG. All automated strategies are executing with full capital allocation.';
      case MarketStatus.WEAK:
        return 'Market environment is WEAK. Allocation sizes are reduced, and strict entry filter gates are applied.';
      default:
        return 'Market environment is NEUTRAL. Normal operations are ongoing with default risk management rules.';
    }
  };

  const getBannerType = (s: MarketStatus) => {
    if (s === MarketStatus.STRONG) return 'success';
    if (s === MarketStatus.WEAK) return 'error';
    return 'warning';
  };

  return (
    <AlertBanner
      message={getBannerMessage(status)}
      type={getBannerType(status)}
    />
  );
}
export default MarketStatusBanner
