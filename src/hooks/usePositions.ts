import { useState, useEffect, useCallback, useRef } from 'react';
import { OpenPosition, PerformanceMetrics } from '@/types/trading';
import { generateMockPositions, generateMockPerformance } from '@/lib/mockData';

interface UsePositionsOptions {
  isRunning: boolean;
  refreshInterval?: number;
}

export function usePositions({
  isRunning,
  refreshInterval = 5000,
}: UsePositionsOptions) {
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics>(generateMockPerformance());
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial positions
  const loadPositions = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setPositions(generateMockPositions(3));
      setPerformance(generateMockPerformance());
      setIsLoading(false);
    }, 300);
  }, []);

  // Load initial mock data on mount
  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  // Update positions over time when running
  useEffect(() => {
    if (isRunning) {
      // Set up interval for position updates
      intervalRef.current = setInterval(() => {
        // Update performance metrics
        setPerformance(prev => ({
          ...prev,
          unrealizedPnl: prev.unrealizedPnl + (Math.random() - 0.45) * 5,
          dailyPnl: prev.dailyPnl + (Math.random() - 0.4) * 2,
        }));

        // Occasionally add a new position (simulating arbitrage execution)
        if (Math.random() < 0.1) {
          const newPos = generateMockPositions(1)[0];
          setPositions(prev => [...prev, newPos].slice(-8)); // Max 8 positions
        }
        
        // Occasionally update filled status
        if (Math.random() < 0.2) {
          setPositions(prev => prev.map(pos => {
            if (!pos.leg1Filled && Math.random() < 0.3) {
              return { ...pos, leg1Filled: true };
            }
            if (pos.leg1Filled && pos.leg2Filled === 'no' && Math.random() < 0.3) {
              return { ...pos, leg2Filled: 'pending' };
            }
            if (pos.leg1Filled && pos.leg2Filled === 'pending' && Math.random() < 0.3) {
              return { ...pos, leg2Filled: 'yes' };
            }
            return pos;
          }));
        }
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

  const closePosition = useCallback((positionId: string) => {
    setPositions(prev => prev.filter(p => p.id !== positionId));
    // Add to realized PnL
    setPerformance(prev => ({
      ...prev,
      realizedPnl: prev.realizedPnl + Math.random() * 20 - 5,
      totalTrades: prev.totalTrades + 1,
    }));
  }, []);

  const refresh = useCallback(() => {
    loadPositions();
  }, [loadPositions]);

  return {
    positions,
    performance,
    isLoading,
    closePosition,
    refresh,
  };
}
