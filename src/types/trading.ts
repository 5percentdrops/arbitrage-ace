// Token types supported by the bot
export type TokenSymbol = 'BTC' | 'ETH' | 'SOL' | 'XRP';

// Connection status for API and RPC
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Bot running status
export type BotStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

// Exit strategy modes
export type ExitMode = 'hold_to_settlement' | 'sell_at_threshold';

// Market timeframe categories
export type MarketTimeframe = '15m' | '1h' | '4h' | 'daily';

// Opportunity status
export type OpportunityStatus = 'detected' | 'executing' | 'open' | 'settled' | 'missed';

// API Configuration
export interface ApiConfig {
  apiKey: string;
  apiSecret: string;
  status: ConnectionStatus;
  lastConnected: Date | null;
  error: string | null;
}

// RPC Configuration
export interface RpcConfig {
  rpcUrl: string;
  chainId: number;
  status: ConnectionStatus;
  blockNumber: number | null;
  error: string | null;
}

// Wallet Configuration
export interface WalletConfig {
  privateKey: string;
  address: string | null;
  maticBalance: number;
  usdcBalance: number;
}

// Filter parameters
export interface FilterParams {
  minLiquidity: number;
  maxLiquidity: number;
  minVolume: number;
  maxVolume: number;
  minTimeToSettlement: number;
  maxTimeToSettlement: number;
  minSpread: number; // e.g., 0.90 means YES + NO >= 0.90
  maxSpread: number; // e.g., 0.98 means YES + NO <= 0.98
}

// Auto compounding settings
export interface CompoundingSettings {
  enabled: boolean;
  maxCapitalPerTrade: number;
  maxSimultaneousPositions: number;
}

// Exit logic settings
export interface ExitSettings {
  mode: ExitMode;
  pnlPercent: number; // e.g., 10 means exit when profit reaches 10%
}

// Arbitrage opportunity
export interface ArbitrageOpportunity {
  id: string;
  token: TokenSymbol;
  marketName: string;
  marketId: string;
  yesPrice: number;
  noPrice: number;
  combinedPrice: number;
  spreadPercent: number;
  liquidity: number;
  volume24h: number;
  timeframe: MarketTimeframe;
  timeToSettlement: number; // in minutes
  status: OpportunityStatus;
  detectedAt: Date;
}

// Order history entry
export interface OrderHistory {
  id: string;
  token: TokenSymbol;
  ticker: string;
  leg1Shares: number;
  leg2Shares: number;
  leg1Locked: number;
  leg1Filled: boolean;
  leg2Filled: boolean;
  pnl: number;
  status: 'filled' | 'partial' | 'pending' | 'cancelled';
  createdAt: Date;
}

// Leg 2 fill status (tri-state)
export type Leg2FillStatus = 'yes' | 'no' | 'pending';

// Open position
export interface OpenPosition {
  id: string;
  marketId: string;
  marketName: string;
  token: TokenSymbol;
  timeframe: MarketTimeframe;
  leg1Shares: number;
  leg2Shares: number;
  leg1Locked: number;
  leg1Filled: boolean;
  leg2Filled: Leg2FillStatus;
  exitMode: ExitMode;
  openedAt: Date;
}

// Position size settings
export interface PositionSizeSettings {
  defaultSize: number;
  minSize: number;
  maxSize: number;
}

// Performance metrics
export interface PerformanceMetrics {
  realizedPnl: number;
  unrealizedPnl: number;
  dailyPnl: number;
  totalPnl: number;
  roiPercent: number;
  totalTrades: number;
  winRate: number;
}

// Preflight check item
export interface PreflightCheck {
  id: string;
  label: string;
  passed: boolean;
  message?: string;
}

// Full bot state
export interface BotState {
  status: BotStatus;
  selectedTokens: TokenSymbol[];
  filters: FilterParams;
  compounding: CompoundingSettings;
  exitSettings: ExitSettings;
  positionSizeSettings: PositionSizeSettings;
  apiConfig: ApiConfig;
  rpcConfig: RpcConfig;
  walletConfig: WalletConfig;
  availableCapital: number;
  lockedCapital: number;
  lastTradeAt: Date | null;
}

// Default values
export const DEFAULT_FILTERS: FilterParams = {
  minLiquidity: 10000,
  maxLiquidity: 10000000,
  minVolume: 5000,
  maxVolume: 5000000,
  minTimeToSettlement: 5,
  maxTimeToSettlement: 1440, // 24 hours
  minSpread: 0.90,
  maxSpread: 0.98,
};

export const DEFAULT_COMPOUNDING: CompoundingSettings = {
  enabled: true,
  maxCapitalPerTrade: 100,
  maxSimultaneousPositions: 5,
};

export const DEFAULT_EXIT_SETTINGS: ExitSettings = {
  mode: 'hold_to_settlement',
  pnlPercent: 10,
};

export const DEFAULT_POSITION_SIZE_SETTINGS: PositionSizeSettings = {
  defaultSize: 50,
  minSize: 10,
  maxSize: 500,
};

export const TOKENS: TokenSymbol[] = ['BTC', 'ETH', 'SOL', 'XRP'];

export const TOKEN_INFO: Record<TokenSymbol, { name: string; color: string }> = {
  BTC: { name: 'Bitcoin', color: 'hsl(38, 92%, 50%)' },
  ETH: { name: 'Ethereum', color: 'hsl(227, 58%, 65%)' },
  SOL: { name: 'Solana', color: 'hsl(280, 67%, 55%)' },
  XRP: { name: 'Ripple', color: 'hsl(210, 10%, 50%)' },
};

// ============= Dump & Hedge Strategy Types =============

// Dump & Hedge cycle state
export type DumpHedgeCycleState = 'waiting' | 'leg1_executed' | 'leg2_executed' | 'settled';

// Dump & Hedge parameters
export interface DumpHedgeParams {
  leg1Shares: number;       // Shares target for Leg 1 (default: 10)
  leg2Shares: number;       // Shares target for Leg 2 (default: 10)
  discoveryPercent: number; // Discovery % - minimum price movement to detect opportunity (default: 0.15)
  lockedPercent: number;    // Locked % - target locked profit percentage (default: 0.05)
  windowMinutes: number;    // Observation window in minutes (default: 3)
}

// Single leg execution data
export interface DumpHedgeLeg {
  side: 'YES' | 'NO';
  entryPrice: number;
  shares: number;
  executedAt: Date;
}

// Complete cycle record
export interface DumpHedgeCycle {
  id: string;
  leg1: DumpHedgeLeg | null;
  leg2: DumpHedgeLeg | null;
  lockedProfit: number;
  lockedProfitPercent: number;
  status: DumpHedgeCycleState;
  completedAt: Date | null;
}

// Full Dump & Hedge state
export interface DumpHedgeState {
  enabled: boolean;           // Auto mode toggle
  params: DumpHedgeParams;
  currentCycle: DumpHedgeCycle | null;
  cycleHistory: DumpHedgeCycle[];  // Last 5 completed cycles
}

// Default values for Dump & Hedge
export const DEFAULT_DUMP_HEDGE_PARAMS: DumpHedgeParams = {
  leg1Shares: 10,
  leg2Shares: 10,
  discoveryPercent: 0.15,
  lockedPercent: 0.05,
  windowMinutes: 3,
};

export const DEFAULT_DUMP_HEDGE_STATE: DumpHedgeState = {
  enabled: false,
  params: DEFAULT_DUMP_HEDGE_PARAMS,
  currentCycle: null,
  cycleHistory: [],
};
