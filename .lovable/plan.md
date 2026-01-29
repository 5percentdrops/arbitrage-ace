

# Filter Prices Strictly Lower Than Chance %

## Overview

Update the order book filtering so all displayed prices are **strictly lower than** the chance percentage (market probability). Currently it allows prices at or equal to the reference price - we need to change to strictly less than.

## Change

**File: `src/components/trading/auto/AutoLadder.tsx`** (lines 226-227)

```tsx
// BEFORE:
const yesInRange = level.yesAskPrice >= yesLowerBound && level.yesAskPrice <= yesUpperBound;
const noInRange = level.noAskPrice >= noLowerBound && level.noAskPrice <= noUpperBound;

// AFTER:
const yesInRange = level.yesAskPrice >= yesLowerBound && level.yesAskPrice < yesUpperBound;
const noInRange = level.noAskPrice >= noLowerBound && level.noAskPrice < noUpperBound;
```

This means:
- If YES chance is 50¢, only YES prices like 49¢, 48¢, 47¢ will show (not 50¢)
- If NO chance is 50¢, only NO prices like 49¢, 48¢, 47¢ will show (not 50¢)

## Files to Modify

| File | Change |
|------|--------|
| `src/components/trading/auto/AutoLadder.tsx` | Change `<=` to `<` for upper bound comparisons |

