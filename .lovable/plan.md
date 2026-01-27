

# Auto-Deploy 7 Limit Orders on Every Price Change

## Summary

Automatically deploy up to 7 limit orders at profitable arbitrage levels (where YES + NO < $1.00) every time prices update. When `autoTradeEnabled` is true, the system will continuously monitor for profitable levels and auto-deploy/update orders on each 300ms refresh cycle.

---

## Current vs New Behavior

```text
CURRENT (Manual):
  - Price updates every 300ms
  - Orders only deploy on user click (Quick Deploy button)
  - autoTradeEnabled toggle exists but does nothing

NEW (Automatic):
  - Price updates every 300ms
  - When autoTradeEnabled=true:
    → Find top 7 profitable levels (YES + NO < $1.00)
    → Auto-deploy tiered orders across those levels
    → Replace previous orders with new levels on each tick
  - When autoTradeEnabled=false: Manual mode (current behavior)
```

---

## Implementation Plan

### 1. Add Auto-Deploy Effect to AutoLadder

**File:** `src/components/trading/auto/AutoLadder.tsx`

Add a `useEffect` that watches for profitable level changes and auto-deploys when enabled:

```typescript
// Add useEffect import if not present
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

// Inside AutoLadder component, add ref to track previous levels
const prevProfitableLevelsRef = useRef<string>('');

// Add auto-deploy effect
useEffect(() => {
  // Only run when auto-trade is enabled and not paused
  if (!autoTradeEnabled || isPaused || isDeploying) return;
  
  // Get current top 7 profitable levels
  const top7 = getTop7Profitable();
  if (top7.length === 0) return;
  
  // Create a fingerprint of current profitable levels
  const currentLevelsKey = top7.map(([price]) => price.toFixed(2)).join(',');
  
  // Skip if levels haven't changed
  if (currentLevelsKey === prevProfitableLevelsRef.current) return;
  prevProfitableLevelsRef.current = currentLevelsKey;
  
  // Auto-deploy orders at these levels
  const tierShares = calculateTieredShares(positionSize, top7.length);
  
  const newOrders: ActiveLadderOrder[] = top7.flatMap(([price, edge], index) => {
    const level = orderBook?.levels.find(l => l.price === price);
    if (!level) return [];
    
    return [
      {
        id: `auto-${Date.now()}-yes-${index}`,
        ladderIndex: index + 1,
        side: 'YES' as const,
        price: level.yesAskPrice,
        shares: tierShares[index],
        filledShares: 0,
        fillPercent: 0,
        status: 'pending' as const,
      },
      {
        id: `auto-${Date.now()}-no-${index}`,
        ladderIndex: index + 1,
        side: 'NO' as const,
        price: level.noAskPrice,
        shares: tierShares[index],
        filledShares: 0,
        fillPercent: 0,
        status: 'pending' as const,
      },
    ];
  });
  
  // Replace all orders with new ones (simulates cancel + redeploy)
  setDeployedOrders(newOrders);
  
}, [autoTradeEnabled, isPaused, isDeploying, getTop7Profitable, positionSize, orderBook]);
```

### 2. Clear Orders When Auto-Trade Disabled

**File:** `src/components/trading/auto/AutoLadder.tsx`

Add cleanup when auto-trade is turned off:

```typescript
// Add effect to clear auto-deployed orders when disabled
useEffect(() => {
  if (!autoTradeEnabled) {
    prevProfitableLevelsRef.current = '';
    // Optionally clear orders when auto-trade disabled:
    // setDeployedOrders([]);
  }
}, [autoTradeEnabled]);
```

### 3. Update UI to Show Auto Mode Status

**File:** `src/components/trading/auto/AutoLadder.tsx`

Add visual indicator when auto-trading is active (in the deployed orders banner):

```typescript
{/* Deployed Orders Banner - updated text */}
{deployedOrders.length > 0 && (
  <div className={cn(
    "flex items-center justify-between px-4 py-2 border-b",
    autoTradeEnabled 
      ? "bg-success/10 border-success/30" 
      : "bg-warning/10 border-warning/30"
  )}>
    <span className={cn(
      "text-xs font-medium",
      autoTradeEnabled ? "text-success" : "text-warning"
    )}>
      {autoTradeEnabled 
        ? `AUTO: ${deployedOrders.length / 2} arb levels active` 
        : `${deployedOrders.length} orders deployed`}
    </span>
    ...
  </div>
)}
```

---

## Visual Result

```text
Auto Trade OFF (current):
┌──────────────────────────────────────┐
│  [Quick Deploy] button available     │
│  User must click to deploy orders    │
└──────────────────────────────────────┘

Auto Trade ON (new):
┌──────────────────────────────────────┐
│  AUTO: 5 arb levels active           │
│  ████ L1: 52¢ YES + 47¢ NO → $125    │
│  ███  L2: 51¢ YES + 48¢ NO → $90     │
│  ██   L3: 50¢ YES + 49¢ NO → $75     │
│  ██   L4: 53¢ YES + 46¢ NO → $65     │
│  █    L5: 54¢ YES + 45¢ NO → $55     │
│        (auto-updates every 300ms)    │
└──────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/trading/auto/AutoLadder.tsx` | Add `useEffect` for auto-deployment when `autoTradeEnabled` is true, add ref to track previous levels, update deployed orders banner styling |

---

## Technical Notes

- Uses `useRef` to track previous profitable levels and avoid redundant updates
- Only redeploys when the set of profitable levels actually changes (not every 300ms)
- Replaces all orders on each update (simulates cancel + redeploy cycle)
- Tiered distribution: L1 gets 25%, L2 gets 18%, down to L7 gets 8%
- Position size split evenly between YES and NO legs at each level
- Pausing the order book also pauses auto-deployment
- The `isDeploying` flag prevents race conditions during deployment

