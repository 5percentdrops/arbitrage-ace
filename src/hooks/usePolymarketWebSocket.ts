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
  isSimulated: boolean;
}

// Generate simulated market data when no real data is available
function generateSimulatedSnapshot(): MarketSnapshot {
  // Random price around 50 cents with some variance
  const baseYes = 0.48 + Math.random() * 0.08; // 0.48 - 0.56
  const spread = 0.01 + Math.random() * 0.02; // 1-3 cent spread
  
  return {
    yesBid: Math.max(0.01, baseYes - spread / 2),
    yesAsk: Math.min(0.99, baseYes + spread / 2),
    noBid: Math.max(0.01, (1 - baseYes) - spread / 2),
    noAsk: Math.min(0.99, (1 - baseYes) + spread / 2),
    ts: new Date().toISOString(),
  };
}

export function usePolymarketWebSocket({
  assetIds,
  enabled = true,
}: UsePolymarketWebSocketOptions): UsePolymarketWebSocketReturn {
  const [marketSnapshot, setMarketSnapshot] = useState<MarketSnapshot | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [hasReceivedRealData, setHasReceivedRealData] = useState(false);
  
  const wsRef = useRef<PolymarketWebSocket | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const noDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket
  useEffect(() => {
    if (!enabled || assetIds.length !== 2) {
      console.log('[usePolymarketWebSocket] Not enabled or missing asset IDs');
      return;
    }

    console.log('[usePolymarketWebSocket] Initializing with assets:', assetIds);
    setHasReceivedRealData(false);
    setIsSimulated(false);

    const ws = new PolymarketWebSocket({
      onUpdate: (snapshot) => {
        console.log('[usePolymarketWebSocket] Received real data:', snapshot);
        setHasReceivedRealData(true);
        setIsSimulated(false);
        setMarketSnapshot(snapshot);
        setLastUpdateTime(new Date());
        setError(null);
        
        // Clear simulation if running
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
          simulationIntervalRef.current = null;
        }
        if (noDataTimeoutRef.current) {
          clearTimeout(noDataTimeoutRef.current);
          noDataTimeoutRef.current = null;
        }
      },
      onStatusChange: (status) => {
        console.log('[usePolymarketWebSocket] Status changed:', status);
        setConnectionStatus(status);
        if (status === 'connected') {
          setError(null);
          
          // Start timeout to check if we receive real data
          noDataTimeoutRef.current = setTimeout(() => {
            if (!hasReceivedRealData) {
              console.log('[usePolymarketWebSocket] No real data received, starting simulation');
              setIsSimulated(true);
              // Start simulation
              const simulate = () => {
                const snapshot = generateSimulatedSnapshot();
                setMarketSnapshot(snapshot);
                setLastUpdateTime(new Date());
              };
              simulate(); // Initial update
              simulationIntervalRef.current = setInterval(simulate, 1000);
            }
          }, 3000); // Wait 3 seconds for real data
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
      
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      if (noDataTimeoutRef.current) {
        clearTimeout(noDataTimeoutRef.current);
        noDataTimeoutRef.current = null;
      }
    };
  }, [assetIds.join(','), enabled]);

  const reconnect = useCallback(() => {
    console.log('[usePolymarketWebSocket] Manual reconnect triggered');
    setHasReceivedRealData(false);
    setIsSimulated(false);
    wsRef.current?.reconnect();
  }, []);

  return {
    marketSnapshot,
    connectionStatus,
    lastUpdateTime,
    error,
    reconnect,
    isSimulated,
  };
}
