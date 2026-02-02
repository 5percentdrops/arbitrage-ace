

# Polymarket WebSocket Integration for Manual Trading

## Overview
Replace the current polling-based market data fetching (every 5 seconds) in the Manual Trading section with real-time WebSocket updates from Polymarket's CLOB API. This will provide instant price updates for YES/NO bid/ask prices.

## Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                     WEBSOCKET DATA FLOW                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────┐         ┌──────────────────┐                    │
│  │   Polymarket     │  WSS    │ usePolymarket    │                    │
│  │   WebSocket      │◄───────►│ WebSocket Hook   │                    │
│  │   Server         │         │                  │                    │
│  └──────────────────┘         └────────┬─────────┘                    │
│                                        │                               │
│                                        ▼                               │
│                               ┌──────────────────┐                    │
│                               │ useManualTrading │                    │
│                               │  (consumes data) │                    │
│                               └────────┬─────────┘                    │
│                                        │                               │
│                                        ▼                               │
│                               ┌──────────────────┐                    │
│                               │  ManualTradePanel │                    │
│                               │  + StatusIndicator│                    │
│                               └──────────────────┘                    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Create Polymarket WebSocket Service

**New File:** `src/services/polymarketWebSocket.ts`

Create a reusable WebSocket class for Polymarket connections:

- **Connection URL**: `wss://ws-subscriptions-clob.polymarket.com/ws/market`
- **Subscription message format**: `{ "assets_ids": [...], "type": "market" }`
- **Keep-alive**: Send "PING" every 10 seconds
- **Auto-reconnect**: Exponential backoff with max 5 attempts
- **Event callbacks**: `onUpdate`, `onConnect`, `onDisconnect`, `onError`

Key features:
- Subscribe/unsubscribe to specific asset IDs (YES/NO token IDs)
- Parse incoming price updates and convert to MarketSnapshot format
- Handle connection state transitions
- Clean disconnect on unmount

### 2. Create WebSocket Hook

**New File:** `src/hooks/usePolymarketWebSocket.ts`

React hook wrapping the WebSocket service:

```typescript
interface UsePolymarketWebSocketOptions {
  assetIds: string[];  // YES and NO token IDs for the market
  enabled?: boolean;
}

interface UsePolymarketWebSocketReturn {
  marketSnapshot: MarketSnapshot | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdateTime: Date | null;
  error: string | null;
  reconnect: () => void;
}
```

State management:
- Track connection status for UI indicator
- Store latest market snapshot from WebSocket messages
- Track last update timestamp
- Handle cleanup on unmount

### 3. Update Manual Trading Hook

**File:** `src/hooks/useManualTrading.ts`

Replace polling with WebSocket:

**Remove:**
- `fetchMarketSnapshot` function
- 5-second polling interval for market data
- `isLoadingSnapshot` state (WebSocket is always streaming)

**Add:**
- Integration with `usePolymarketWebSocket` hook
- WebSocket connection status in return value
- Asset ID mapping based on selected token (BTC, ETH, etc.)

**Keep:**
- Order fetching via REST API (orders are not streamed)
- All form state and validation logic

### 4. Add Asset ID Configuration

**New File or Update:** `src/lib/polymarketConfig.ts`

Map trading assets to Polymarket token IDs:

```typescript
export const POLYMARKET_ASSETS = {
  BTC: {
    yesTokenId: "...",  // YES token asset ID
    noTokenId: "...",   // NO token asset ID
    conditionId: "...", // Market condition ID
  },
  ETH: { ... },
  SOL: { ... },
} as const;
```

### 5. Update UI Components

**File:** `src/components/trading/ManualTradePanel.tsx`

Add WebSocket connection indicator:

- Show green dot when connected
- Show yellow dot when connecting/reconnecting
- Show red dot with error tooltip when disconnected
- Display "Live" badge when receiving real-time updates

**File:** `src/pages/Index.tsx`

Pass WebSocket status from `useManualTrading` to `TradingTabs`/`ManualTradePanel`:

```typescript
const manualTrading = useManualTrading({
  isBotRunning: state.status === 'running',
  assetIds: POLYMARKET_ASSETS[selectedAsset],
});

// Pass to UI
<TradingTabs
  ...
  wsStatus={manualTrading.wsStatus}
  lastPriceUpdate={manualTrading.lastUpdateTime}
/>
```

## WebSocket Message Handling

**Incoming message types to handle:**

1. **Price Update** - Update market snapshot with new bid/ask
2. **Book Snapshot** - Full order book refresh
3. **Connection Ack** - Subscription confirmed
4. **Error** - Handle and display to user

**Message parsing:**
```typescript
// Example incoming price update
{
  "event_type": "price_change",
  "asset_id": "...",
  "price": "0.52",
  "side": "buy" | "sell",
  "timestamp": "..."
}
```

## Files Changed

| File | Changes |
|------|---------|
| `src/services/polymarketWebSocket.ts` | NEW - WebSocket connection class |
| `src/hooks/usePolymarketWebSocket.ts` | NEW - React hook for WebSocket |
| `src/lib/polymarketConfig.ts` | NEW - Asset ID mappings |
| `src/hooks/useManualTrading.ts` | Replace polling with WebSocket hook |
| `src/components/trading/ManualTradePanel.tsx` | Add connection status indicator |
| `src/pages/Index.tsx` | Pass WebSocket status to components |
| `src/types/manual-trading.ts` | Add WebSocket status types |

## Connection States

| State | UI | Description |
|-------|-----|-------------|
| `connecting` | Yellow pulse | Initial connection or reconnecting |
| `connected` | Green + "Live" | Receiving real-time updates |
| `disconnected` | Gray | Manually disconnected or closed |
| `error` | Red + tooltip | Connection failed, showing error message |

## Error Handling

1. **Network Error**: Show toast, attempt reconnect with backoff
2. **Auth Error**: Show error in UI, prompt to check API credentials
3. **Rate Limit**: Back off, show warning message
4. **Invalid Asset**: Show error, disable trading for that asset

## Fallback Behavior

If WebSocket fails to connect after max retries:
- Fall back to polling mode (existing behavior)
- Show warning that real-time updates unavailable
- Allow manual refresh button

