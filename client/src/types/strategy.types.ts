// Type definitions for strategy rules, parameters, and risk management configurations
import { TargetMode } from './enums'

export interface StrategyConfig {
  id: string
  name: string
  version: number
  model: 'MODEL_1' | 'MODEL_2' | 'CUSTOM'
  entryRules: RuleBlock[]
  exitRules: RuleBlock[]
  riskParams: RiskParams
  isActive: boolean
  createdAt: string
}

export interface RuleBlock {
  id: string
  field: string
  operator: string
  value: number | string
  logicGate?: 'AND' | 'OR'
}

export interface RiskParams {
  maxCapitalPerTrade: number
  stopLossPercent: number
  targetPercent: number
  targetMode: TargetMode
  stepPercent: number
  weakMarketQtyMultiplier: number
}
