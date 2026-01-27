
# Fix Order Visibility on Ladder Rows

## Problem Identified

Auto-deployed orders are not showing on the ladder rows because of a price matching mismatch:

1. **Orders are created** with actual ask prices (`level.yesAskPrice`, `level.noAskPrice`)
2. **Order book regenerates** every 300ms with different randomized prices
3. **Row matching fails** because the deployed order prices no longer match current row prices

```text
Tick 1 (order created):
  level.price = 0.50
  level.yesAskPrice = 0.485 (with arb discount)
  → Order created: price = 0.485

Tick 2 (order book regenerates):
  level.price = 0.50  
  level.yesAskPrice = 0.502 (different random discount)
  → Order at 0.485 doesn't match any row!
```

---

## Solution

Match orders to rows using the **reference price** (`level.price`) instead of actual ask prices. Store `levelPrice` on orders for stable matching.

---

## Implementation Plan

### 1. Update Order Type to Include Level Price

**File:** `src/types/auto-trading.ts`

Add `levelPrice` field to `ActiveLadderOrder`:

```typescript
export interface ActiveLadderOrder {
  id: string;
  ladderIndex: number;
  side: 'YES' | 'NO';
  price: number;        // Actual execution price
  levelPrice: number;   // NEW: Reference level price for row matching
  shares: number;
  filledShares: number;
  fillPercent: number;
  status: 'pending' | 'partial' | 'filled' | 'cancelled';
}
```

### 2. Update Auto-Deploy to Store Level Price

**File:** `src/components/trading/auto/AutoLadder.tsx`

When creating orders, include the `levelPrice`:

```typescript
const newOrders: ActiveLadderOrder[] = top7.flatMap(([price, edge], index) => {
  const level = orderBook.levels.find(l => l.price === price);
  if (!level) return [];
  
  return [
    {
      id: `auto-${Date.now()}-yes-${index}`,
      ladderIndex: index + 1,
      side: 'YES' as const,
      price: level.yesAskPrice,
      levelPrice: price,  // ADD: Store reference price
      shares: tierShares[index],
      // ...
    },
    {
      id: `auto-${Date.now()}-no-${index}`,
      ladderIndex: index + 1,
      side: 'NO' as const,
      price: level.noAskPrice,
      levelPrice: price,  // ADD: Store reference price
      shares: tierShares[index],
      // ...
    },
  ];
});
```

### 3. Update Quick Deploy and Confirm Paired Order

**File:** `src/components/trading/auto/AutoLadder.tsx`

Update `handleQuickDeploy` and `handleConfirmPairedOrder` to also include `levelPrice`.

### 4. Update Ladder Row Matching Logic

**File:** `src/components/trading/auto/BetAngelLadder.tsx`

Change order matching to use `levelPrice` instead of execution price:

```typescript
// BEFORE (broken):
const ordersAtPrice = sideOrders.filter(o => Math.abs(o.price - price) < 0.005);

// AFTER (fixed):
const ordersAtPrice = sideOrders.filter(o => 
  o.levelPrice !== undefined && Math.abs(o.levelPrice - level.price) < 0.005
);
```

---

## Visual Result

```text
BEFORE (orders invisible):
┌─────────────────────────────┐
│  50¢  │  BUY  │  SELL       │  ← Order deployed but not shown
│  49¢  │  BUY  │  SELL       │
│  48¢  │  BUY  │  SELL       │
└─────────────────────────────┘

AFTER (orders visible):
┌─────────────────────────────┐
│  50¢  │ [L1] ██  │  ██       │  ← Order shows with tier label
│  49¢  │ [L2] ██  │  ██       │  ← Order shows with tier label
│  48¢  │  BUY  │  SELL       │
└─────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/auto-trading.ts` | Add `levelPrice` field to `ActiveLadderOrder` interface |
| `src/components/trading/auto/AutoLadder.tsx` | Include `levelPrice` when creating orders in auto-deploy, quick deploy, and confirm paired order handlers |
| `src/components/trading/auto/BetAngelLadder.tsx` | Match orders to rows using `levelPrice` instead of execution `price` |

---

## Technical Notes

- `levelPrice` is the stable reference price (e.g., 0.50) used to identify which row an order belongs to
- `price` remains the actual execution price (e.g., 0.485) for display/trading purposes
- Matching tolerance of 0.005 (0.5¢) is sufficient for reference prices since they're on a fixed 1¢ grid
- Backward compatible: old orders without `levelPrice` simply won't show indicators (graceful degradation)
