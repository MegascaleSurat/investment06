// Heatmap grid component rendering comparative slot volume spikes
import React from 'react'

export function VolumeSlotHeatmap() {
  const timeSlots = ['09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00'];
  const stocks = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];

  // Mock generator for volume ratios (0.2x to 3.5x)
  const getMockRatio = (stockIndex: number, slotIndex: number) => {
    const val = ((stockIndex * 3 + slotIndex * 7) % 35) / 10;
    return val || 0.5;
  };

  const getHeatmapColor = (ratio: number) => {
    if (ratio >= 2.5) return 'bg-emerald-500 text-white font-bold';
    if (ratio >= 1.5) return 'bg-emerald-500/60 text-foreground';
    if (ratio >= 1.0) return 'bg-emerald-500/20 text-foreground';
    if (ratio >= 0.5) return 'bg-muted text-muted-foreground';
    return 'bg-rose-500/25 text-rose-500';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-3xl space-y-4">
        <div className="grid grid-cols-9 gap-2">
          <div className="text-xs font-semibold text-muted-foreground self-center">Stock</div>
          {timeSlots.map((slot) => (
            <div key={slot} className="text-center text-xs font-semibold text-muted-foreground uppercase">
              {slot}
            </div>
          ))}
        </div>

        {stocks.map((stock, stockIdx) => (
          <div key={stock} className="grid grid-cols-9 gap-2 items-center">
            <div className="text-xs font-bold text-foreground">{stock}</div>
            {timeSlots.map((slot, slotIdx) => {
              const ratio = getMockRatio(stockIdx, slotIdx);
              return (
                <div
                  key={slot}
                  title={`Ratio: ${ratio.toFixed(2)}x`}
                  className={`py-3 text-center text-xs rounded-lg transition-all border border-border/20 ${getHeatmapColor(ratio)}`}
                >
                  {ratio.toFixed(1)}x
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
export default VolumeSlotHeatmap
