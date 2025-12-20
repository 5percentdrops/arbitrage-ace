// Token types supported by the bot
export type TokenSymbol = 'BTC' | 'ETH' | 'SOL' | 'XRP';

// Connection status for API and RPC
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Bot running status
export type BotStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

// Exit strategy modes
export type ExitMode = 'hold_to_settlement' | 'sell_at_threshold';

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
  minVolume: number;
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
  earlyExitThreshold: number; // e.g., 1.00 means exit when value reaches $1.00
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
  timeToSettlement: number; // in minutes
  status: OpportunityStatus;
  detectedAt: Date;
}

// Open position
export interface OpenPosition {
  id: string;
  marketId: string;
  marketName: string;
  token: TokenSymbol;
  yesSize: number;
  noSize: number;
  entryCost: number;
  lockedCapital: number;
  exitMode: ExitMode;
  timeRemaining: number; // in minutes
  unrealizedPnl: number;
  openedAt: Date;
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
  minVolume: 5000,
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
  earlyExitThreshold: 1.00,
};

export const TOKENS: TokenSymbol[] = ['BTC', 'ETH', 'SOL', 'XRP'];

export const TOKEN_INFO: Record<TokenSymbol, { name: string; color: string }> = {
  BTC: { name: 'Bitcoin', color: 'hsl(38, 92%, 50%)' },
  ETH: { name: 'Ethereum', color: 'hsl(227, 58%, 65%)' },
  SOL: { name: 'Solana', color: 'hsl(280, 67%, 55%)' },
  XRP: { name: 'Ripple', color: 'hsl(210, 10%, 50%)' },
};
