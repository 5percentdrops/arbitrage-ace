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

// Generate mock order book data for development
export function generateMockOrderBook(): OrderBookData {
  const refPrice = 0.50;
  const tick = 0.01;
  const levels: OrderBookData['levels'] = [];
  
  // Generate ±20 levels around reference price
  for (let i = -20; i <= 20; i++) {
    const price = Math.round((refPrice + i * tick) * 100) / 100;
    if (price <= 0 || price >= 1) continue;
    
    // Create realistic bid/ask spreads
    const baseSize = Math.floor(Math.random() * 500) + 50;
    const yesBid = Math.floor(baseSize * (0.8 + Math.random() * 0.4));
    const yesAsk = Math.floor(baseSize * (0.8 + Math.random() * 0.4));
    const noBid = Math.floor(baseSize * (0.8 + Math.random() * 0.4));
    const noAsk = Math.floor(baseSize * (0.8 + Math.random() * 0.4));
    
    levels.push({ price, yesBid, yesAsk, noBid, noAsk });
  }
  
  // Sort by price descending (highest at top)
  levels.sort((a, b) => b.price - a.price);
  
  // Inject some profitable arbitrage opportunities
  // Create levels where YES price + NO price < 1.0 (after accounting for the spread)
  const arbLevels = [
    { price: 0.48, yesBid: 200, yesAsk: 350, noBid: 180, noAsk: 400 }, // 0.48 + 0.51 = 0.99 (1% edge)
    { price: 0.49, yesBid: 250, yesAsk: 420, noBid: 220, noAsk: 380 }, // 0.49 + 0.50 = 0.99 (1% edge)
    { price: 0.47, yesBid: 180, yesAsk: 280, noBid: 150, noAsk: 320 }, // 0.47 + 0.52 = 0.99 (1% edge)
    { price: 0.46, yesBid: 300, yesAsk: 500, noBid: 280, noAsk: 450 }, // 0.46 + 0.52 = 0.98 (2% edge)
  ];
  
  // Replace matching levels with arb opportunities
  arbLevels.forEach(arb => {
    const idx = levels.findIndex(l => Math.abs(l.price - arb.price) < 0.001);
    if (idx !== -1) {
      levels[idx] = arb;
    }
  });
  
  return {
    tick,
    refPrice,
    levels,
    best: {
      yesBid: 0.49,
      yesAsk: 0.50,
      noBid: 0.50,
      noAsk: 0.51,
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
