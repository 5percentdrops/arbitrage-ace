// Polymarket CLOB WebSocket Service
// wss://ws-subscriptions-clob.polymarket.com/ws/market

import type { MarketSnapshot } from '@/types/manual-trading';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface PolymarketWebSocketCallbacks {
  onUpdate: (snapshot: MarketSnapshot) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onError: (error: string) => void;
}

interface PriceData {
  asset_id: string;
  price: string;
  side: 'BUY' | 'SELL';
}

export class PolymarketWebSocket {
  private ws: WebSocket | null = null;
  private assetIds: string[] = [];
  private callbacks: PolymarketWebSocketCallbacks;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isManualClose = false;
  
  // Track current prices for both assets
  private currentPrices: {
    yesBid: number;
    yesAsk: number;
    noBid: number;
    noAsk: number;
  } = {
    yesBid: 0,
    yesAsk: 0,
    noBid: 0,
    noAsk: 0,
  };

  constructor(callbacks: PolymarketWebSocketCallbacks) {
    this.callbacks = callbacks;
  }

  connect(assetIds: string[]): void {
    if (assetIds.length !== 2) {
      console.error('[PolymarketWS] Expected 2 asset IDs (YES and NO tokens)');
      return;
    }

    this.assetIds = assetIds;
    this.isManualClose = false;
    this.reconnectAttempts = 0;
    
    this.callbacks.onStatusChange('connecting');
    this.createConnection();
  }

  private createConnection(): void {
    try {
      console.log('[PolymarketWS] Connecting to WebSocket...');
      this.ws = new WebSocket('wss://ws-subscriptions-clob.polymarket.com/ws/market');

      this.ws.onopen = () => {
        console.log('[PolymarketWS] Connected, subscribing to assets:', this.assetIds);
        this.subscribe();
        this.startPing();
        this.callbacks.onStatusChange('connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('[PolymarketWS] WebSocket error:', error);
        this.callbacks.onError('WebSocket connection error');
      };

      this.ws.onclose = (event) => {
        console.log('[PolymarketWS] WebSocket closed:', event.code, event.reason);
        this.cleanup();
        
        if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else if (!this.isManualClose) {
          this.callbacks.onStatusChange('error');
          this.callbacks.onError('Max reconnection attempts reached');
        } else {
          this.callbacks.onStatusChange('disconnected');
        }
      };
    } catch (error) {
      console.error('[PolymarketWS] Failed to create connection:', error);
      this.callbacks.onStatusChange('error');
      this.callbacks.onError('Failed to create WebSocket connection');
    }
  }

  private subscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const subscribeMsg = {
      assets_ids: this.assetIds,
      type: 'market',
    };

    console.log('[PolymarketWS] Sending subscription:', subscribeMsg);
    this.ws.send(JSON.stringify(subscribeMsg));
  }

  private handleMessage(data: string): void {
    try {
      // Handle PONG response
      if (data === 'PONG') {
        console.log('[PolymarketWS] Received PONG');
        return;
      }

      const messages = JSON.parse(data);
      
      // Handle array of price updates
      if (Array.isArray(messages)) {
        messages.forEach((msg) => this.processPriceUpdate(msg));
      } else {
        this.processPriceUpdate(messages);
      }
    } catch (error) {
      console.error('[PolymarketWS] Failed to parse message:', error, data);
    }
  }

  private processPriceUpdate(msg: unknown): void {
    // Polymarket sends price updates with asset_id, price, and side
    const update = msg as PriceData;
    
    if (!update.asset_id || !update.price) {
      console.log('[PolymarketWS] Unknown message format:', msg);
      return;
    }

    const price = parseFloat(update.price);
    const isYesToken = update.asset_id === this.assetIds[0];
    const isNoToken = update.asset_id === this.assetIds[1];

    if (isYesToken) {
      if (update.side === 'BUY') {
        this.currentPrices.yesBid = price;
      } else {
        this.currentPrices.yesAsk = price;
      }
    } else if (isNoToken) {
      if (update.side === 'BUY') {
        this.currentPrices.noBid = price;
      } else {
        this.currentPrices.noAsk = price;
      }
    }

    // Emit updated snapshot
    const snapshot: MarketSnapshot = {
      yesBid: this.currentPrices.yesBid,
      yesAsk: this.currentPrices.yesAsk,
      noBid: this.currentPrices.noBid,
      noAsk: this.currentPrices.noAsk,
      ts: new Date().toISOString(),
    };

    this.callbacks.onUpdate(snapshot);
  }

  private startPing(): void {
    this.stopPing();
    
    // Send PING every 10 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('[PolymarketWS] Sending PING');
        this.ws.send('PING');
      }
    }, 10000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[PolymarketWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    this.callbacks.onStatusChange('connecting');
    
    setTimeout(() => {
      this.createConnection();
    }, delay);
  }

  private cleanup(): void {
    this.stopPing();
    this.ws = null;
  }

  disconnect(): void {
    console.log('[PolymarketWS] Manual disconnect');
    this.isManualClose = true;
    
    if (this.ws) {
      this.ws.close();
    }
    
    this.cleanup();
    this.callbacks.onStatusChange('disconnected');
  }

  reconnect(): void {
    this.disconnect();
    this.isManualClose = false;
    this.reconnectAttempts = 0;
    this.connect(this.assetIds);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
