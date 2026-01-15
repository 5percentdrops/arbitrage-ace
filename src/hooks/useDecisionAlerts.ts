import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';
import type { DecisionAlert, AlertAsset, AlertAction, AlertSignal } from '@/types/decision-alerts';

// Mock data generator for demo purposes
function generateMockAlerts(): DecisionAlert[] {
  const assets: AlertAsset[] = ['BTC', 'ETH', 'SOL', 'XRP'];
  const now = new Date();
  
  return assets.map((asset, index) => {
    const cycleStart = new Date(now.getTime() - (10 - index) * 60 * 1000);
    const cycleEnd = new Date(cycleStart.getTime() + 15 * 60 * 1000);
    const secondsRemaining = Math.max(0, Math.floor((cycleEnd.getTime() - now.getTime()) / 1000));
    const upPrice = 0.45 + Math.random() * 0.15;
    const downPrice = 1 - upPrice - 0.02;
    // Crowd sentiment (what the majority is betting)
    const crowdIsUp = Math.random() > 0.5;
    
    // Signals point OPPOSITE to crowd (contrarian divergence strategy)
    const signals: AlertSignal[] = [
      { signal_type: 'CVD_DIV', direction: crowdIsUp ? 'BEARISH' : 'BULLISH', timeframe: '1m', notes: 'Strong divergence detected' },
      { signal_type: 'FR_DIV', direction: crowdIsUp ? 'BEARISH' : 'BULLISH', timeframe: '1m' }
    ];

    return {
      id: `demo-${asset}-${index}`,
      asset,
      market_id: `polymarket-${asset.toLowerCase()}-15m`,
      cycle_start: cycleStart.toISOString(),
      cycle_end: cycleEnd.toISOString(),
      seconds_remaining: secondsRemaining,
      majority_side: crowdIsUp ? 'UP' : 'DOWN',
      majority_pct: 55 + Math.floor(Math.random() * 20),
      majority_proxy_label: 'Binance Perps',
      up_price: parseFloat(upPrice.toFixed(3)),
      down_price: parseFloat(downPrice.toFixed(3)),
      signals,
      recommended_side: crowdIsUp ? 'BUY_DOWN' : 'BUY_UP',
      score: 70 + Math.floor(Math.random() * 25),
      reason_short: crowdIsUp 
        ? `${asset} bearish divergence vs crowd bullish sentiment` 
        : `${asset} bullish divergence vs crowd bearish sentiment`,
      liquidity: {
        spread: 0.01 + Math.random() * 0.02,
        spread_ok: true,
        best_bid_size_usd: 5000 + Math.random() * 10000,
        best_ask_size_usd: 5000 + Math.random() * 10000
      },
      status: 'READY',
      created_at: cycleStart.toISOString(),
      ttl_seconds: secondsRemaining
    };
  });
}

interface UseDecisionAlertsOptions {
  assetFilter: AlertAsset | 'ALL';
  autoRefresh: boolean;
}

interface UseDecisionAlertsReturn {
  alerts: DecisionAlert[];
  isLoading: boolean;
  error: string | null;
  autoRefresh: boolean;
  setAutoRefresh: (value: boolean) => void;
  fetchAlerts: () => Promise<void>;
  executeAction: (id: string, action: AlertAction) => Promise<boolean>;
  isActionInFlight: boolean;
}

export function useDecisionAlerts({ 
  assetFilter, 
  autoRefresh: initialAutoRefresh = true 
}: UseDecisionAlertsOptions): UseDecisionAlertsReturn {
  const [alerts, setAlerts] = useState<DecisionAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(initialAutoRefresh);
  const [isActionInFlight, setIsActionInFlight] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const useMockData = useRef(false);

  // Sort alerts: highest score first, then newest
  const sortAlerts = useCallback((alertList: DecisionAlert[]): DecisionAlert[] => {
    return [...alertList].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      // If we've already switched to mock data, keep using it
      if (useMockData.current) {
        let mockAlerts = generateMockAlerts();
        if (assetFilter !== 'ALL') {
          mockAlerts = mockAlerts.filter(a => a.asset === assetFilter);
        }
        setAlerts(sortAlerts(mockAlerts));
        setError(null);
        setIsLoading(false);
        return;
      }

      const params: Record<string, string> = {
        status: 'READY',
        limit: '50'
      };
      
      if (assetFilter !== 'ALL') {
        params.asset = assetFilter;
      }

      const response = await apiGet<DecisionAlert[]>('/api/v1/decision-alerts', params);
      
      if (response.success && response.data) {
        setAlerts(sortAlerts(response.data));
        setError(null);
      } else {
        // Fall back to mock data on API failure
        useMockData.current = true;
        let mockAlerts = generateMockAlerts();
        if (assetFilter !== 'ALL') {
          mockAlerts = mockAlerts.filter(a => a.asset === assetFilter);
        }
        setAlerts(sortAlerts(mockAlerts));
        setError(null);
        toast.info('Using demo data', { description: 'API unavailable, showing sample alerts' });
      }
    } catch (err) {
      // Fall back to mock data on error
      useMockData.current = true;
      let mockAlerts = generateMockAlerts();
      if (assetFilter !== 'ALL') {
        mockAlerts = mockAlerts.filter(a => a.asset === assetFilter);
      }
      setAlerts(sortAlerts(mockAlerts));
      setError(null);
      toast.info('Using demo data', { description: 'API unavailable, showing sample alerts' });
    } finally {
      setIsLoading(false);
    }
  }, [assetFilter, sortAlerts]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchAlerts();
  }, [fetchAlerts]);

  // Polling effect - pauses when action is in flight
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (autoRefresh && !isActionInFlight) {
      intervalRef.current = setInterval(fetchAlerts, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, isActionInFlight, fetchAlerts]);

  const executeAction = useCallback(async (id: string, action: AlertAction): Promise<boolean> => {
    setIsActionInFlight(true);
    
    // Optimistic update for BUY actions
    const isBuyAction = action === 'BUY_UP' || action === 'BUY_DOWN';
    const previousAlerts = [...alerts];
    
    if (isBuyAction) {
      setAlerts(current => 
        current.map(alert => 
          alert.id === id ? { ...alert, status: 'EXECUTING' as const } : alert
        )
      );
    }

    // If using mock data, simulate the action
    if (useMockData.current) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setAlerts(current => current.filter(alert => alert.id !== id));
      toast.success(`Action ${action} executed successfully (demo)`);
      setIsActionInFlight(false);
      return true;
    }

    try {
      const response = await apiPost<DecisionAlert>(
        `/api/v1/decision-alerts/${id}/action`,
        { action, source: 'FRONTEND' }
      );

      if (response.success) {
        // Refetch to get updated list
        await fetchAlerts();
        toast.success(`Action ${action} executed successfully`);
        return true;
      } else {
        // Revert on failure
        if (isBuyAction) {
          setAlerts(previousAlerts);
        }
        toast.error('Action failed', { description: response.error });
        return false;
      }
    } catch (err) {
      // Revert on error
      if (isBuyAction) {
        setAlerts(previousAlerts);
      }
      toast.error('Action failed', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      });
      return false;
    } finally {
      setIsActionInFlight(false);
    }
  }, [alerts, fetchAlerts]);

  return {
    alerts,
    isLoading,
    error,
    autoRefresh,
    setAutoRefresh,
    fetchAlerts,
    executeAction,
    isActionInFlight
  };
}
