import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';
import type { DecisionAlert, AlertAsset, AlertAction } from '@/types/decision-alerts';

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

  // Sort alerts: highest score first, then newest
  const sortAlerts = useCallback((alertList: DecisionAlert[]): DecisionAlert[] => {
    return [...alertList].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
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
        setError(response.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
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
