
# Fix Order Book Filtering Logic

## Problem Analysis

The current filtering logic requires **both** YES and NO ask prices to fall within their respective 10% ranges below the best ask. This is overly restrictive because:

1. YES prices cluster around `price` (e.g., 0.48, 0.50, 0.52)
2. NO prices cluster around `1 - price` (e.g., 0.52, 0.50, 0.48)

These are different price bands. A level with `yesAskPrice = 0.48` will have `noAskPrice ≈ 0.52`, so it's nearly impossible for both to be in range simultaneously.

**Current logic (too restrictive):**
```
yesInRange AND noInRange → almost nothing passes
```

## Solution

Change the filtering to require **either** YES or NO to be in a valid limit order range below best ask, rather than both. This makes logical sense because:

- If you want to place a limit order on the YES side, you need YES price to be below the best YES ask
- If you want to place a limit order on the NO side, you need NO price to be below the best NO ask
- The ladder shows opportunities on both sides, so showing a level when *either* side has a valid limit order opportunity is appropriate

**New logic (inclusive):**
```
yesInRange OR noInRange → shows more levels
```

Alternatively, we could filter each ladder independently (YES ladder shows YES range, NO ladder shows NO range), but that would require architectural changes to pass different level sets to each ladder.

---

## Implementation

### File: `src/components/trading/auto/AutoLadder.tsx`

**Change the filter condition (around lines 223-229):**

Replace:
```typescript
return orderBook.levels.filter(level => {
  // YES ask must be within range below best (exclusive of best)
  const yesInRange = level.yesAskPrice >= yesLowerBound && level.yesAskPrice < bestYesAsk;
  // NO ask must be within range below best (exclusive of best)
  const noInRange = level.noAskPrice >= noLowerBound && level.noAskPrice < bestNoAsk;
  
  if (!yesInRange || !noInRange) return false;
```

With:
```typescript
return orderBook.levels.filter(level => {
  // YES ask within range below best (exclusive of best)
  const yesInRange = level.yesAskPrice >= yesLowerBound && level.yesAskPrice < bestYesAsk;
  // NO ask within range below best (exclusive of best)
  const noInRange = level.noAskPrice >= noLowerBound && level.noAskPrice < bestNoAsk;
  
  // Show level if EITHER side has a valid limit order opportunity
  if (!yesInRange && !noInRange) return false;
```

---

## Summary

| File | Change |
|------|--------|
| `src/components/trading/auto/AutoLadder.tsx` | Change filter from AND to OR logic so levels show if either YES or NO has a valid limit order price |

This simple one-line change (from `!yesInRange || !noInRange` to `!yesInRange && !noInRange`) will show many more levels while still maintaining the limit order price constraint for at least one side.
