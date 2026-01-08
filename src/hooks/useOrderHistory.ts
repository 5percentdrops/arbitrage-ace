import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderHistory, TokenSymbol } from '@/types/trading';

const TICKERS = ['BTC-UP-15M', 'BTC-DOWN-1H', 'ETH-UP-4H', 'ETH-DOWN-DAILY', 'SOL-UP-1H', 'SOL-DOWN-15M', 'XRP-UP-4H', 'XRP-DOWN-1H'];
const TOKENS: TokenSymbol[] = ['BTC', 'ETH', 'SOL', 'XRP'];

function generateMockOrderHistory(count: number): OrderHistory[] {
  const orders: OrderHistory[] = [];
  const statuses: OrderHistory['status'][] = ['filled', 'partial', 'pending', 'cancelled'];
  
  for (let i = 0; i < count; i++) {
    const token = TOKENS[Math.floor(Math.random() * TOKENS.length)];
    const ticker = TICKERS.filter(t => t.startsWith(token))[Math.floor(Math.random() * 2)] || `${token}-UP-1H`;
    const leg1Shares = Math.floor(Math.random() * 50) + 5;
    const leg2Shares = Math.floor(Math.random() * 50) + 5;
    const leg1Locked = leg1Shares * (Math.random() * 0.5 + 0.4);
    const leg1Filled = Math.random() > 0.3;
    const leg2Filled = leg1Filled && Math.random() > 0.4;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const pnl = status === 'filled' ? (Math.random() - 0.3) * 50 : 0;
    
    orders.push({
      id: `order-${Date.now()}-${i}`,
      token,
      ticker,
      leg1Shares,
      leg2Shares,
      leg1Locked,
      leg1Filled,
      leg2Filled,
      pnl: Number(pnl.toFixed(2)),
      status,
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
          
          // Occasionally update existing order status
          if (Math.random() < 0.2 && prev.length > 0) {
            const idx = Math.floor(Math.random() * prev.length);
            const updated = [...prev];
            if (updated[idx].status === 'pending') {
              updated[idx] = { ...updated[idx], leg1Filled: true, status: 'partial' };
            } else if (updated[idx].status === 'partial') {
              updated[idx] = { ...updated[idx], leg2Filled: true, status: 'filled' };
            }
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
