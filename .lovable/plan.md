
# Fix: Display YES/NO Prices in Manual Trading Section

## Problem
The WebSocket connection is working correctly (connecting, receiving pings, and falling back to simulation), but the YES/NO price data is not being displayed anywhere on the page. The `MarketSnapshotCard` component exists but isn't rendered in `Index.tsx`.

## Solution
Add the `MarketSnapshotCard` component to the Manual Trading section to display the real-time YES/NO bid/ask prices from the Polymarket WebSocket.

## Implementation

### File: `src/pages/Index.tsx`

Add the MarketSnapshotCard import and render it in the right column above the trading tabs:

**Changes:**
1. Import `MarketSnapshotCard`
2. Add it to the JSX between `PerformancePanel` and `RoundTimerCard`
3. Pass the WebSocket-powered market data from `manualTrading` hook

```tsx
// Add import
import { MarketSnapshotCard } from '@/components/trading/MarketSnapshotCard';

// In JSX (right column, after PerformancePanel):
<MarketSnapshotCard
  asset={manualTrading.formState.asset}
  snapshot={manualTrading.marketSnapshot}
  isLoading={manualTrading.wsStatus === 'connecting'}
  error={manualTrading.wsError}
  lastUpdated={manualTrading.snapshotLastUpdated}
  onRefresh={manualTrading.reconnectWebSocket}
/>
```

## Visual Result

After the fix, the Manual Trading page will show:
- **Market Snapshot card** with YES bid/ask prices (green) and NO bid/ask prices (red)
- Combined YES+NO ask price with spread percentage
- Last update time and refresh button
- Real-time updates every second (simulated or live)

## File Changed

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add MarketSnapshotCard to display YES/NO prices |
