// Volume intelligence page analyzing slot volume heatmaps and ratios
import React from 'react'
import VolumeSlotHeatmap from './VolumeSlotHeatmap'

export function VolumeIntelligencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Volume Intelligence</h2>
        <p className="text-sm text-muted-foreground">Examine stock volume spikes and comparative slot averages</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-bold text-foreground mb-6">Volume Slots Heatmap (15-min Intervals)</h3>
        <VolumeSlotHeatmap />
      </div>
    </div>
  );
}
export default VolumeIntelligencePage
