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

  // Update positions over time
  useEffect(() => {
    if (isRunning) {
      // Initial load
      if (positions.length === 0) {
        loadPositions();
      }

      // Set up interval for position updates
      intervalRef.current = setInterval(() => {
        setPositions(prev => {
          return prev.map(pos => ({
            ...pos,
            timeRemaining: Math.max(0, pos.timeRemaining - 1),
            unrealizedPnl: pos.unrealizedPnl + (Math.random() - 0.4) * 2,
          })).filter(pos => pos.timeRemaining > 0);
        });

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
  }, [isRunning, refreshInterval, loadPositions, positions.length]);

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
