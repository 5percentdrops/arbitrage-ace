import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderHistory, TokenSymbol, MarketTimeframe } from '@/types/trading';

const TICKERS = ['BTC-UP-15M', 'BTC-DOWN-15M', 'ETH-UP-15M', 'ETH-DOWN-15M', 'SOL-UP-15M', 'SOL-DOWN-15M', 'XRP-UP-15M', 'XRP-DOWN-15M'];
const TOKENS: TokenSymbol[] = ['BTC', 'ETH', 'SOL', 'XRP'];

function generateMockOrderHistory(count: number): OrderHistory[] {
  const orders: OrderHistory[] = [];
  
  for (let i = 0; i < count; i++) {
    const token = TOKENS[Math.floor(Math.random() * TOKENS.length)];
    const ticker = TICKERS.filter(t => t.startsWith(token))[Math.floor(Math.random() * 2)] || `${token}-UP-15M`;
    const entryPrice = Math.random() * 0.3 + 0.4; // 0.40 - 0.70
    const pnl = (Math.random() - 0.3) * 50;
    
    orders.push({
      id: `order-${Date.now()}-${i}`,
      token,
      ticker,
      timeframe: '15m' as MarketTimeframe,
      entryPrice: Number(entryPrice.toFixed(3)),
      pnl: Number(pnl.toFixed(2)),
      createdAt: new Date(Date.now() - Math.random() * 86400000),
    });
  }
  
  return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

interface UseOrderHistoryOptions {
  isRunning: boolean;
  refreshInterval?: number;
}

export function useOrderHistory({
  isRunning,
  refreshInterval = 5000,
}: UseOrderHistoryOptions) {
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadOrders = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      const newOrders = generateMockOrderHistory(8);
      setOrders(newOrders);
      setLastRefresh(new Date());
      setIsLoading(false);
    }, 300);
  }, []);

  // Load initial data on mount
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Auto-refresh when running
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setOrders(prev => {
          // Occasionally add new orders
          if (Math.random() < 0.3 && prev.length < 12) {
            const newOrder = generateMockOrderHistory(1)[0];
            return [newOrder, ...prev].slice(0, 12);
          }
          
          // Occasionally update existing order PnL
          if (Math.random() < 0.2 && prev.length > 0) {
            const idx = Math.floor(Math.random() * prev.length);
            const updated = [...prev];
            updated[idx] = { 
              ...updated[idx], 
              pnl: updated[idx].pnl + (Math.random() - 0.4) * 5 
            };
            return updated;
          }
          
          return prev;
        });
        setLastRefresh(new Date());
      }, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, refreshInterval]);

  return {
    orders,
    isLoading,
    lastRefresh,
    refresh: loadOrders,
  };
}