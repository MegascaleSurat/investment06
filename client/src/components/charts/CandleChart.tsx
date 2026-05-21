// Interactive stock candlestick charts wrapping Recharts composed graphs
import React from 'react'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface CandleData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface CandleChartProps {
  data: CandleData[]
  className?: string
}

export function CandleChart({ data, className = '' }: CandleChartProps) {
  // Map candlestick data for Recharts rendering (min/max calculations)
  const formattedData = data.map((d) => ({
    ...d,
    // Bar height from open to close, starting from min(open, close)
    candleMinMax: [d.open, d.close],
    wickMinMax: [d.low, d.high],
  }));

  return (
    <div className={`w-full h-80 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis stroke="var(--muted-foreground)" fontSize={12} domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
          <Bar dataKey="candleMinMax" fill="var(--primary)" radius={2} />
          <Line dataKey="wickMinMax" stroke="var(--muted-foreground)" strokeWidth={1} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
export default CandleChart
