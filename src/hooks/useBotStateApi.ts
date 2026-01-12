import { useState, useCallback, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import type { TokenSymbol } from '@/types/trading';
import type { BotStateResponse, ActionLogEntry } from '@/types/manual-trading';

export interface UseBotStateApiOptions {
  asset: TokenSymbol;
  enabled?: boolean;
}

export function useBotStateApi({ asset, enabled = true }: UseBotStateApiOptions) {
  const [botState, setBotState] = useState<BotStateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [actionLogs, setActionLogs] = useState<ActionLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  // Fetch bot state
  const fetchBotState = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    const response = await apiGet<BotStateResponse>('/state', { asset });
    
    if (response.success && response.data) {
      setBotState(response.data);
    } else {
      setError(response.error || 'Failed to fetch bot state');
      setBotState(null);
    }
    
    setIsLoading(false);
  }, [asset, enabled]);

  // Fetch action logs
  const fetchActionLogs = useCallback(async (limit: number = 100) => {
    if (!enabled) return;
    
    setIsLoadingLogs(true);
    setLogsError(null);
    
    const response = await apiGet<ActionLogEntry[]>('/logs', { 
      asset, 
      limit: limit.toString() 
    });
    
    if (response.success && response.data) {
      setActionLogs(response.data);
    } else {
      setLogsError(response.error || 'Failed to fetch logs');
      setActionLogs([]);
    }
    
    setIsLoadingLogs(false);
  }, [asset, enabled]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled) return;
    
    fetchBotState();
    fetchActionLogs();
    
    const stateInterval = setInterval(fetchBotState, 5000);
    const logsInterval = setInterval(() => fetchActionLogs(100), 10000);
    
    return () => {
      clearInterval(stateInterval);
      clearInterval(logsInterval);
    };
  }, [fetchBotState, fetchActionLogs, enabled]);

  // Derived state
  const hasActivePosition = botState 
    ? (botState.leg1SharesFilled > 0 || botState.leg2SharesFilled > 0)
    : false;

  const isTradingDisabled = botState?.tradingDisabled ?? false;
  const disabledReason = botState?.disabledReason ?? null;

  return {
    botState,
    isLoading,
    error,
    fetchBotState,
    
    actionLogs,
    isLoadingLogs,
    logsError,
    fetchActionLogs,
    
    hasActivePosition,
    isTradingDisabled,
    disabledReason,
  };
}
