import { useState, useEffect, useRef, useCallback } from 'react';
import { PolymarketWebSocket, type ConnectionStatus } from '@/services/polymarketWebSocket';
import type { MarketSnapshot } from '@/types/manual-trading';

export interface UsePolymarketWebSocketOptions {
  assetIds: string[];
  enabled?: boolean;
}

export interface UsePolymarketWebSocketReturn {
  marketSnapshot: MarketSnapshot | null;
  connectionStatus: ConnectionStatus;
  lastUpdateTime: Date | null;
  error: string | null;
  reconnect: () => void;
}

export function usePolymarketWebSocket({
  assetIds,
  enabled = true,
}: UsePolymarketWebSocketOptions): UsePolymarketWebSocketReturn {
  const [marketSnapshot, setMarketSnapshot] = useState<MarketSnapshot | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<PolymarketWebSocket | null>(null);

  // Initialize WebSocket
  useEffect(() => {
    if (!enabled || assetIds.length !== 2) {
      console.log('[usePolymarketWebSocket] Not enabled or missing asset IDs');
      return;
    }

    console.log('[usePolymarketWebSocket] Initializing with assets:', assetIds);

    const ws = new PolymarketWebSocket({
      onUpdate: (snapshot) => {
        setMarketSnapshot(snapshot);
        setLastUpdateTime(new Date());
        setError(null);
      },
      onStatusChange: (status) => {
        console.log('[usePolymarketWebSocket] Status changed:', status);
        setConnectionStatus(status);
        if (status === 'connected') {
          setError(null);
        }
      },
      onError: (err) => {
        console.error('[usePolymarketWebSocket] Error:', err);
        setError(err);
      },
    });

    wsRef.current = ws;
    ws.connect(assetIds);

    return () => {
      console.log('[usePolymarketWebSocket] Cleanup - disconnecting');
      ws.disconnect();
      wsRef.current = null;
    };
  }, [assetIds.join(','), enabled]);

  const reconnect = useCallback(() => {
    console.log('[usePolymarketWebSocket] Manual reconnect triggered');
    wsRef.current?.reconnect();
  }, []);

  return {
    marketSnapshot,
    connectionStatus,
    lastUpdateTime,
    error,
    reconnect,
  };
}
