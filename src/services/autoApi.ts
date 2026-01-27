// Auto Trading API Client
import { apiGet, apiPost } from '@/lib/api';
import type { 
  OrderBookData, 
  DeployLadderRequest, 
  DeployLadderResponse,
  ActiveLadderOrder 
} from '@/types/auto-trading';

const POLL_INTERVAL = 300; // 300ms polling

// Fetch order book data
export async function fetchOrderBook(marketId: string): Promise<OrderBookData | null> {
  const response = await apiGet<OrderBookData>('/orderbook', { marketId });
  if (response.success && response.data) {
    return response.data;
  }
  return null;
}

// Deploy ladder orders
export async function deployLadder(request: DeployLadderRequest): Promise<DeployLadderResponse> {
  const response = await apiPost<DeployLadderResponse>('/auto/deploy-ladder', request);
  if (response.success && response.data) {
    return response.data;
  }
  return {
    success: false,
    orders: [],
    message: response.error || 'Failed to deploy ladder',
  };
}

// Fetch active ladder orders
export async function fetchActiveOrders(marketId: string): Promise<ActiveLadderOrder[]> {
  const response = await apiGet<{ orders: ActiveLadderOrder[] }>('/auto/orders', { marketId });
  if (response.success && response.data) {
    return response.data.orders;
  }
  return [];
}

// Cancel all ladder orders
export async function cancelAllOrders(marketId: string): Promise<boolean> {
  const response = await apiPost<{ success: boolean }>('/auto/cancel-all', { marketId });
  return response.success && response.data?.success === true;
}

// Track price state between calls (simulates market movement)
let currentRefPrice = 0.50;

// Generate mock order book data for development
// Creates realistic arbitrage opportunities where YES + NO < $1.00
export function generateMockOrderBook(): OrderBookData {
  // Drift the reference price randomly by ±0.5¢ each tick
  const drift = (Math.random() - 0.5) * 0.01; // -0.5¢ to +0.5¢
  currentRefPrice = Math.max(0.20, Math.min(0.80, currentRefPrice + drift));
  
  const refPrice = Math.round(currentRefPrice * 100) / 100;
  const tick = 0.01;
  const levels: OrderBookData['levels'] = [];
  
  // Randomly select 4-7 price levels that will have arbitrage opportunities
  const arbLevelCount = Math.floor(Math.random() * 4) + 4; // 4-7 levels
  const arbLevelIndices = new Set<number>();
  while (arbLevelIndices.size < arbLevelCount) {
    arbLevelIndices.add(Math.floor(Math.random() * 41) - 20); // -20 to +20
  }
  
  // Generate ±20 levels around reference price
  for (let i = -20; i <= 20; i++) {
    const price = Math.round((refPrice + i * tick) * 100) / 100;
    if (price <= 0 || price >= 1) continue;
    
    // Create realistic bid/ask spreads with sizes
    const baseSize = Math.floor(Math.random() * 500) + 50;
    const yesBid = Math.floor(baseSize * (0.8 + Math.random() * 0.4));
    const yesAsk = Math.floor(baseSize * (0.8 + Math.random() * 0.4));
    const noBid = Math.floor(baseSize * (0.8 + Math.random() * 0.4));
    const noAsk = Math.floor(baseSize * (0.8 + Math.random() * 0.4));
    
    // Calculate actual ask prices
    // For arb levels, create a discount so YES + NO < 1.0
    const isArbLevel = arbLevelIndices.has(i);
    let yesAskPrice = price;
    let noAskPrice = 1 - price;
    
    if (isArbLevel) {
      // Create 1-3% gross edge for arbitrage opportunities
      const discount = 0.01 + Math.random() * 0.02; // 1-3% discount
      // Randomly apply discount to YES, NO, or split between both
      const discountSplit = Math.random();
      if (discountSplit < 0.33) {
        yesAskPrice = price - discount;
      } else if (discountSplit < 0.66) {
        noAskPrice = (1 - price) - discount;
      } else {
        yesAskPrice = price - discount / 2;
        noAskPrice = (1 - price) - discount / 2;
      }
    } else {
      // For non-arb levels, add slight premium so YES + NO >= 1.0
      const premium = Math.random() * 0.01; // 0-1% premium
      yesAskPrice = price + premium / 2;
      noAskPrice = (1 - price) + premium / 2;
    }
    
    // Ensure prices stay within valid bounds
    yesAskPrice = Math.max(0.01, Math.min(0.99, yesAskPrice));
    noAskPrice = Math.max(0.01, Math.min(0.99, noAskPrice));
    
    levels.push({ 
      price, 
      yesBid, 
      yesAsk, 
      yesAskPrice: Math.round(yesAskPrice * 100) / 100,
      noBid, 
      noAsk,
      noAskPrice: Math.round(noAskPrice * 100) / 100,
    });
  }
  
  // Sort by price descending (highest at top)
  levels.sort((a, b) => b.price - a.price);
  
  return {
    tick,
    refPrice,
    levels,
    best: {
      yesBid: Math.round((refPrice - 0.01) * 100) / 100,
      yesAsk: refPrice,
      noBid: Math.round((1 - refPrice) * 100) / 100,
      noAsk: Math.round((1 - refPrice + 0.01) * 100) / 100,
    },
    fee: {
      takerPct: 0.4,
      makerPct: 0.0,
    },
  };
}

// WebSocket support (placeholder for future implementation)
export class OrderBookWebSocket {
  private ws: WebSocket | null = null;
  private marketId: string;
  private onUpdate: (data: OrderBookData) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  constructor(marketId: string, onUpdate: (data: OrderBookData) => void) {
    this.marketId = marketId;
    this.onUpdate = onUpdate;
  }
  
  connect(): void {
    // WebSocket connection would go here
    // For now, we'll use polling in the hook
    console.log('WebSocket not implemented, using polling');
  }
  
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
