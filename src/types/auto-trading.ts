// Auto Trading Order Book Types

export interface OrderBookLevel {
  price: number;        // Reference price for this row
  yesBid: number;       // Size available at YES bid
  yesAsk: number;       // Size available at YES ask
  yesAskPrice: number;  // Actual YES ask price (may differ from level.price)
  noBid: number;        // Size available at NO bid
  noAsk: number;        // Size available at NO ask
  noAskPrice: number;   // Actual NO ask price (may differ from 1-price)
}

export interface BestPrices {
  yesBid: number;
  yesAsk: number;
  noBid: number;
  noAsk: number;
}

export interface FeeInfo {
  takerPct: number;
  makerPct: number;
}

export interface OrderBookData {
  tick: number;
  refPrice: number;
  levels: OrderBookLevel[];
  best: BestPrices;
  fee: FeeInfo;
}

export interface LadderSelection {
  side: 'YES' | 'NO';
  price: number;
  type: 'bid' | 'ask';
}

export interface ArbitrageEdge {
  grossEdge: number;
  grossEdgePct: number;
  netEdge: number;
  netEdgePct: number;
  totalCost: number;
  yesPrice: number;
  noPrice: number;
}

export interface ActiveLadderOrder {
  id: string;
  ladderIndex: number; // L1, L2, ... L7
  side: 'YES' | 'NO';
  price: number;
  levelPrice: number;  // Reference level price for stable row matching
  shares: number;
  filledShares: number;
  fillPercent: number;
  status: 'pending' | 'partial' | 'filled' | 'cancelled';
  arbAmount: number;   // Potential arb profit = (1 - totalCost) * shares
}

export interface DeployLadderRequest {
  marketId: string;
  asset: string;
  rangePct: number;
  maxOrders: number;
  totalSizeUsd?: number;
  totalShares?: number;
  distribution: 'topHeavy' | 'uniform' | 'bottomHeavy';
  minNetEdgePct: number;
  mode: 'manual' | 'auto';
}

export interface DeployLadderResponse {
  success: boolean;
  orders: ActiveLadderOrder[];
  message?: string;
}

export type AutoTradeMode = 'off' | 'manual' | 'auto';

export interface LevelEdgeInfo {
  totalCost: number;
  grossEdgePct: number;
  netEdgePct: number;
  isProfitable: boolean;
}

export interface PairedArbSelection {
  levelPrice: number;    // The reference price level clicked
  yesPrice: number;      // Actual YES ask price
  noPrice: number;       // Actual NO ask price
  totalCost: number;     // yesPrice + noPrice (must be < 1.0)
  edgePct: number;       // Net edge percentage
  yesAllocation: number; // USD allocated to YES leg
  noAllocation: number;  // USD allocated to NO leg
}
