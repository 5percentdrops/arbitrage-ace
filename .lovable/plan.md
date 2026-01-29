

# Fix Empty Order Book - Remove Auto-Loosen Filtering

## Problem
The order book is empty because the tiered filtering logic (Strict → Loosened → Depth Only) introduced complexity but the core filter constraints are still too strict:
- Strict mode requires `yesAskPrice < refPrice` AND `noAskPrice < (1 - refPrice)` simultaneously
- The simulated data rarely satisfies both conditions at the same time
- The fallback to "Depth Only" is also filtering by `level.price` being near `refPrice`, which may not match actual ask prices

## Solution
Replace the complex tiered filtering with simple depth-based filtering that shows all levels within the configured range, then apply the "Arb Only" filter on top if enabled.

## Changes

### File: `src/components/trading/auto/AutoLadder.tsx`

**Replace lines 212-277** (the entire `visibleLevels` useMemo block)

Current complex tiered logic will be replaced with:

```tsx
// Simple filtering: show levels within depth range around refPrice
const visibleLevels = useMemo(() => {
  if (!orderBook) return [];
  
  const refPrice = orderBook.refPrice;
  const rangePct = orderBookRangePct / 100;
  
  // Filter by reference price range (simple depth window)
  const depthLevels = orderBook.levels.filter(level => {
    // Show levels whose reference price is within the depth window
    return level.price >= refPrice * (1 - rangePct) && 
           level.price <= refPrice * (1 + rangePct);
  });
  
  // Apply arb filter if enabled
  if (showProfitableOnly) {
    return depthLevels.filter(level => profitableLevels.has(level.price));
  }
  
  return depthLevels;
}, [orderBook, showProfitableOnly, profitableLevels, orderBookRangePct]);
```

**Remove the `filterMode` state and Badge** (lines 597-610)

Since we're removing the tiered filtering, the "Strict / Loosened / Depth Only" badge is no longer needed.

**Remove the `FilterMode` type declaration** (line 214)

## Summary of Changes

| Location | Change |
|----------|--------|
| Lines 212-277 | Replace tiered filtering with simple depth + arb filter |
| Lines 597-610 | Remove filter mode Badge from UI |
| Line 214 | Remove `FilterMode` type |

## Result
- Order book will show all levels within the configured depth range (5-30%)
- "Arb Only" toggle still works - when ON, only profitable levels appear
- No more empty order book - levels are always visible within the depth window
- Simpler, more predictable behavior

