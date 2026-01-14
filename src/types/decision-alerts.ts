// Decision Alerts Types for Polymarket 15m Up/Down cycles

export type AlertAsset = 'BTC' | 'ETH' | 'SOL' | 'XRP';

export interface AlertSignal {
  signal_type: 'CVD_DIV' | 'FR_DIV';
  direction: 'BULLISH' | 'BEARISH';
  timeframe: '1m';
  notes?: string;
}

export interface AlertLiquidity {
  spread: number;
  spread_ok: boolean;
  best_bid_size_usd?: number;
  best_ask_size_usd?: number;
}

export type AlertStatus = 
  | 'READY' 
  | 'EXECUTING' 
  | 'EXECUTED' 
  | 'REJECTED' 
  | 'SKIPPED' 
  | 'SNOOZED' 
  | 'ENTRY_CLOSED' 
  | 'EXPIRED';

export interface DecisionAlert {
  id: string;
  asset: AlertAsset;
  market_id: string;
  cycle_start: string;
  cycle_end: string;
  seconds_remaining: number;
  majority_side: 'UP' | 'DOWN';
  majority_pct?: number;
  majority_proxy_label?: string;
  up_price: number;
  down_price: number;
  signals: AlertSignal[];
  recommended_side: 'BUY_UP' | 'BUY_DOWN';
  score: number;
  reason_short: string;
  liquidity: AlertLiquidity;
  status: AlertStatus;
  created_at: string;
  ttl_seconds?: number;
}

export type AlertAction = 'BUY_UP' | 'BUY_DOWN' | 'IGNORE' | 'SNOOZE';

export interface AlertActionPayload {
  action: AlertAction;
  size_preset?: 'P1' | 'P2';
  source: 'FRONTEND';
}
