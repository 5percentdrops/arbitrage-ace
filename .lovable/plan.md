

# Fix Auto-Deploy to Trigger on Every Price Change

## Problem

The current auto-deploy only triggers when the **set of profitable price levels** changes (e.g., 0.50, 0.51 becomes 0.49, 0.50). It does NOT trigger when the actual YES/NO ask prices change within those same levels.

```text
Tick 1: Level 0.50 → YES: 0.485, NO: 0.505 → Orders deployed
Tick 2: Level 0.50 → YES: 0.490, NO: 0.502 → NO REDEPLOY (fingerprint same: "0.50")
```

## Solution

Include the actual YES and NO prices in the fingerprint, so orders redeploy whenever prices change at any profitable level.

---

## Implementation Plan

### 1. Update Auto-Deploy Fingerprint

**File:** `src/components/trading/auto/AutoLadder.tsx`

Change the fingerprint to include actual ask prices, not just reference prices:

```typescript
// BEFORE (only tracks reference prices):
const currentLevelsKey = top7.map(([price]) => price.toFixed(2)).join(',');

// AFTER (tracks actual YES + NO prices at each level):
const currentLevelsKey = top7.map(([price]) => {
  const level = orderBook.levels.find(l => l.price === price);
  if (!level) return price.toFixed(2);
  return `${price.toFixed(2)}:${level.yesAskPrice.toFixed(3)}:${level.noAskPrice.toFixed(3)}`;
}).join(',');
```

This creates a fingerprint like:
```text
"0.50:0.485:0.505,0.51:0.492:0.498,..."
```

Now when any YES or NO price changes, the fingerprint changes, triggering a redeploy.

---

## Visual Flow After Fix

```text
Order Book Update (every 300ms)
       ↓
Calculate top 7 profitable levels (YES + NO < $1.00)
       ↓
Build fingerprint with actual prices:
  "0.50:0.485:0.505,0.51:0.492:0.498"
       ↓
Compare to previous fingerprint
       ↓
If different → Cancel old orders → Deploy new 7 orders
       ↓
Update fingerprint ref
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/trading/auto/AutoLadder.tsx` | Update `currentLevelsKey` to include `yesAskPrice` and `noAskPrice` in the fingerprint |

---

## Technical Notes

- Orders will now redeploy on every 300ms tick where prices change (even slightly)
- The tiered allocation (L1: 25%, L2: 18%, etc.) remains the same
- Position size is split evenly between YES and NO legs at each level
- If no profitable levels exist (all YES + NO >= $1.00), orders are cleared
- Pausing the order book still pauses auto-deployment

