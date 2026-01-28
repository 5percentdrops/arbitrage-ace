

# Remove Auto-Expansion from Depth Slider

## Overview

Remove the automatic range expansion feature from the order book depth slider. Currently, if fewer than 5 levels are visible at the selected range, the system auto-expands by 5% increments up to 50%. This will be disabled so the slider shows exactly the range the user selects.

## Changes

**File: `src/components/trading/auto/AutoLadder.tsx`**

### 1. Simplify the `visibleLevels` useMemo (lines 215-260)

Remove the auto-expansion loop and just filter with the user-selected range:

```tsx
// BEFORE (lines 215-260):
const { visibleLevels, effectiveRangePct } = useMemo(() => {
  if (!orderBook) return { visibleLevels: [], effectiveRangePct: orderBookRangePct };
  
  const MIN_VISIBLE_LEVELS = 5;
  const MAX_RANGE_PCT = 50;
  const RANGE_INCREMENT = 5;
  
  // ... filterLevels function ...
  
  // Auto-expand if fewer than MIN_VISIBLE_LEVELS
  while (filtered.length < MIN_VISIBLE_LEVELS && currentRange < MAX_RANGE_PCT) {
    currentRange += RANGE_INCREMENT;
    filtered = filterLevels(currentRange);
  }
  
  return { visibleLevels: filtered, effectiveRangePct: currentRange };
}, [...]);

// AFTER:
const visibleLevels = useMemo(() => {
  if (!orderBook) return [];
  
  const yesLastPrice = orderBook.refPrice;
  const noLastPrice = 1 - orderBook.refPrice;
  
  const yesUpperBound = yesLastPrice;
  const yesLowerBound = yesLastPrice * (1 - orderBookRangePct / 100);
  const noUpperBound = noLastPrice;
  const noLowerBound = noLastPrice * (1 - orderBookRangePct / 100);
  
  return orderBook.levels.filter(level => {
    const yesInRange = level.yesAskPrice >= yesLowerBound && level.yesAskPrice <= yesUpperBound;
    const noInRange = level.noAskPrice >= noLowerBound && level.noAskPrice <= noUpperBound;
    
    if (!yesInRange && !noInRange) return false;
    
    if (showProfitableOnly) {
      return profitableLevels.has(level.price);
    }
    return true;
  });
}, [orderBook, showProfitableOnly, profitableLevels, orderBookRangePct]);
```

### 2. Simplify the depth display (lines 618-623)

Remove the conditional "(auto)" label since there's no auto-expansion:

```tsx
// BEFORE:
<span className="text-xs font-mono text-foreground w-16">
  {effectiveRangePct > orderBookRangePct 
    ? <span className="text-warning">{effectiveRangePct}%<span className="text-muted-foreground text-[10px]"> (auto)</span></span>
    : `${orderBookRangePct}%`
  }
</span>

// AFTER:
<span className="text-xs font-mono text-foreground w-12">
  {orderBookRangePct}%
</span>
```

## Summary

| File | Change |
|------|--------|
| `src/components/trading/auto/AutoLadder.tsx` | Remove auto-expansion logic from `visibleLevels` useMemo and simplify depth display |

