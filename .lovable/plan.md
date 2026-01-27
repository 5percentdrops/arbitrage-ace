
# Fix Order Book Best Price Calculation

## Problem Analysis

The order book displays prices higher than the "best ask" because there's a mismatch between:

1. **Static best prices**: `orderBook.best.yesAsk` is set to `refPrice` (e.g., 50c)
2. **Dynamic level prices**: `level.yesAskPrice` values are randomly generated and can be higher or lower than `refPrice`

For example, with `refPrice = 0.50`:
- `best.yesAsk = 0.50` (static)
- But a level might have `yesAskPrice = 0.52` (due to premium added in mock generation)

The filtering logic uses these incorrect "best" values, so levels with prices above the true market best are slipping through.

## Root Cause

In `src/services/autoApi.ts`, the `best` prices are calculated statically from `refPrice`:

```typescript
best: {
  yesBid: Math.round((refPrice - 0.01) * 100) / 100,
  yesAsk: refPrice,  // Static - not the actual minimum ask!
  noBid: Math.round((1 - refPrice) * 100) / 100,
  noAsk: Math.round((1 - refPrice + 0.01) * 100) / 100,
}
```

But the actual ask prices in `levels` are generated with random premiums/discounts, so the true best (lowest) ask may differ.

## Solution

Update the mock data generator to calculate `best` prices dynamically from the actual level data. This ensures `best.yesAsk` is truly the lowest YES ask price available, and `best.noAsk` is the lowest NO ask price.

---

## Technical Implementation

### File: `src/services/autoApi.ts`

**Update the best price calculation (lines 126-140):**

After generating all levels, calculate the actual minimum ask prices:

```typescript
// Calculate actual best prices from generated levels
const bestYesAsk = Math.min(...levels.map(l => l.yesAskPrice));
const bestNoAsk = Math.min(...levels.map(l => l.noAskPrice));
const bestYesBid = Math.max(...levels.filter(l => l.yesBid > 0).map(l => l.yesAskPrice - 0.01));
const bestNoBid = Math.max(...levels.filter(l => l.noBid > 0).map(l => l.noAskPrice - 0.01));

return {
  tick,
  refPrice,
  levels,
  best: {
    yesBid: Math.round(bestYesBid * 100) / 100,
    yesAsk: Math.round(bestYesAsk * 100) / 100,
    noBid: Math.round(bestNoBid * 100) / 100,
    noAsk: Math.round(bestNoAsk * 100) / 100,
  },
  fee: {
    takerPct: 0.4,
    makerPct: 0.0,
  },
};
```

---

## Summary

| File | Change |
|------|--------|
| `src/services/autoApi.ts` | Calculate `best` prices dynamically from actual level ask prices instead of using static values from `refPrice` |

This ensures the filtering logic in `AutoLadder.tsx` correctly identifies which prices are below the market's true best ask, so only valid limit order opportunities are displayed.
