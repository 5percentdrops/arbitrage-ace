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
// Creates realistic arbitrage opportunities where YES + NO < $1.00
export function generateMockOrderBook(): OrderBookData {
  const refPrice = 0.50;
  const tick = 0.01;
  const levels: OrderBookData['levels'] = [];
  
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
    
    levels.push({ price, yesBid, yesAsk, noBid, noAsk });
  }
  
  // Sort by price descending (highest at top)
  levels.sort((a, b) => b.price - a.price);
  
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
