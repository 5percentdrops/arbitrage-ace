import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import type { TokenSymbol } from '@/types/trading';
import type { RoundInfo } from '@/types/manual-trading';

export type SyncStatus = 'synced' | 'client-side' | 'error';

export interface RoundTimerState {
  roundStart: Date;
  roundEnd: Date;
  secondsRemaining: number;
  progressPercent: number;
  isJustStarted: boolean;
  syncStatus: SyncStatus;
  asset: TokenSymbol;
}

// Calculate UTC-aligned round boundaries for a given duration (5 or 15 minutes)
function calculateRoundBoundaries(now: Date, durationMinutes: 5 | 15 = 15): { start: Date; end: Date } {
  const utcMinutes = now.getUTCMinutes();
  const roundedMinutes = Math.floor(utcMinutes / durationMinutes) * durationMinutes;
  
  const start = new Date(now);
  start.setUTCMinutes(roundedMinutes, 0, 0);
  
  const end = new Date(start);
  end.setUTCMinutes(roundedMinutes + durationMinutes);
  
  return { start, end };
}

export function useRoundTimer(initialAsset: TokenSymbol = 'BTC') {
  const [asset, setAsset] = useState<TokenSymbol>(initialAsset);
  const [roundDuration, setRoundDuration] = useState<5 | 15>(15);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('client-side');
  const [serverRoundInfo, setServerRoundInfo] = useState<RoundInfo | null>(null);
  
  // Calculate current round state
  const [timerState, setTimerState] = useState<RoundTimerState>(() => {
    const now = new Date();
    const { start, end } = calculateRoundBoundaries(now, 15);
    const secondsRemaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
    const totalSeconds = 15 * 60;
    const elapsedSeconds = totalSeconds - secondsRemaining;
    
    return {
      roundStart: start,
      roundEnd: end,
      secondsRemaining,
      progressPercent: (elapsedSeconds / totalSeconds) * 100,
      isJustStarted: elapsedSeconds <= 10,
      syncStatus: 'client-side',
      asset,
    };
  });

  // Sync with backend (optional)
  const syncWithBackend = useCallback(async () => {
    const response = await apiGet<RoundInfo>('/round/current', { asset });
    
    if (response.success && response.data) {
      setServerRoundInfo(response.data);
      setSyncStatus('synced');
    } else {
      setSyncStatus('client-side');
      setServerRoundInfo(null);
    }
  }, [asset]);

  // Initial sync attempt
  useEffect(() => {
    syncWithBackend();
    // Re-sync every 30 seconds
    const syncInterval = setInterval(syncWithBackend, 30000);
    return () => clearInterval(syncInterval);
  }, [syncWithBackend]);

  // Update timer every second
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      let start: Date;
      let end: Date;
      let secondsRemaining: number;

      if (serverRoundInfo && syncStatus === 'synced') {
        // Use server data
        start = new Date(serverRoundInfo.roundStartUtc);
        end = new Date(serverRoundInfo.roundEndUtc);
        secondsRemaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      } else {
        // Client-side calculation using selected duration
        const boundaries = calculateRoundBoundaries(now, roundDuration);
        start = boundaries.start;
        end = boundaries.end;
        secondsRemaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      }

      const totalSeconds = roundDuration * 60;
      const elapsedSeconds = totalSeconds - secondsRemaining;
      // Red alert: last 5 min for 15m rounds, last 1 min for 5m rounds
      const alertThreshold = roundDuration === 15 ? 300 : 60;

      setTimerState({
        roundStart: start,
        roundEnd: end,
        secondsRemaining,
        progressPercent: (elapsedSeconds / totalSeconds) * 100,
        isJustStarted: elapsedSeconds <= 10,
        syncStatus,
        asset,
      });

      // If round just ended, re-sync with backend
      if (secondsRemaining === 0) {
        setTimeout(syncWithBackend, 500);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [serverRoundInfo, syncStatus, asset, syncWithBackend, roundDuration]);

  const alertThreshold = roundDuration === 15 ? 300 : 60;

  return {
    ...timerState,
    asset,
    setAsset,
    roundDuration,
    setRoundDuration,
    alertThreshold,
    refresh: syncWithBackend,
  };
}
