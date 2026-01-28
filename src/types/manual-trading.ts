import type { TokenSymbol } from './trading';

// Round Information (from backend)
export interface RoundInfo {
  asset: TokenSymbol;
  roundId: string;
  roundStartUtc: string;
  roundEndUtc: string;
  secondsRemaining: number;
}

// Manual Order Types
export type ManualTradingOutcome = 'YES' | 'NO';
export type ManualTradingAction = 'BUY' | 'SELL';
export type TimeInForce = 'GTC' | 'IOC';

export type ManualTradingOrderType = 'LIMIT' | 'MARKET';

export interface ManualOrder {
  asset: TokenSymbol;
  outcome: ManualTradingOutcome;
  action: ManualTradingAction;
  orderType: ManualTradingOrderType;
  shares: number;
  limitPrice?: number;
  timeInForce: TimeInForce;
}

// Market Snapshot (best bid/ask)
export interface MarketSnapshot {
  yesBid: number;
  yesAsk: number;
  noBid: number;
  noAsk: number;
  ts: string;
}

// Open Order
export interface OpenOrder {
  id: string;
  asset: TokenSymbol;
  outcome: ManualTradingOutcome;
  side: ManualTradingAction;
  shares: number;
  price: number;
  filledShares: number;
  status: 'open' | 'partial' | 'filled' | 'cancelled';
  createdAt: string;
}

// Bot State Response (for positions/PnL)
export type BotStateType = 
  | 'OBSERVATION'
  | 'DISCOVERY_ARMED'
  | 'LEG1_PENDING'
  | 'LEG2_PENDING'
  | 'HEDGED'
  | 'IDLE';

export interface BotStateResponse {
  asset: TokenSymbol;
  state: BotStateType;
  leg1SharesFilled: number;
  leg1AvgPrice: number;
  leg2SharesFilled: number;
  leg2AvgPrice: number;
  shareEqualityProgress: number;
  realizedPnl: number;
  unrealizedPnl: number;
  tradingDisabled?: boolean;
  disabledReason?: string;
}

// Action Log Entry
export interface ActionLogEntry {
  id: string;
  timestamp: string;
  type: 'fill' | 'order' | 'cancel' | 'error' | 'info';
  message: string;
  asset?: TokenSymbol;
  details?: Record<string, unknown>;
}

// Validation errors
export interface ValidationErrors {
  shares?: string;
  limitPrice?: string;
  notionalUsd?: string;
}

// Form validation
export interface ManualTradeFormState {
  asset: TokenSymbol;
  outcome: ManualTradingOutcome;
  action: ManualTradingAction;
  orderType: ManualTradingOrderType;
  shares: string;
  limitPrice: string;
  useNotional: boolean;
  notionalUsd: string;
  // Signal fields
  crowdPct: string;
  remainingTime: string;
}

export const INITIAL_FORM_STATE: ManualTradeFormState = {
  asset: 'BTC',
  outcome: 'YES',
  action: 'BUY',
  orderType: 'LIMIT',
  shares: '',
  limitPrice: '',
  useNotional: true,
  notionalUsd: '',
  crowdPct: '',
  remainingTime: '',
};
