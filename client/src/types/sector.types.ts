// Type definitions for sector performance and breadth analysis
import { SectorStatus } from './enums'

export interface SectorMetrics {
  sectorId: string
  sectorName: string
  sectorReturnPct: number
  breadthPct: number
  avgVolumeRatio: number
  outperformancePct: number
  sectorStatus: SectorStatus
  rank: number
}
