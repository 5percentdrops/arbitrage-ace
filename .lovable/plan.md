

# Dynamic Reference Price for Moving Order Book Window

## Summary

Make the YES and NO reference prices dynamic (not fixed at 50¢) so that the ±5% order book window moves as prices change. Each 300ms refresh will generate slightly different reference prices, causing the visible price range to shift accordingly.

---

## Current vs New Behavior

```text
CURRENT (Fixed):
  refPrice = 0.50 (always)
  Window: 47.5¢ - 52.5¢ (never moves)

NEW (Dynamic):
  refPrice = 0.48 → Window: 45.6¢ - 50.4¢
  refPrice = 0.52 → Window: 49.4¢ - 54.6¢
  refPrice = 0.55 → Window: 52.25¢ - 57.75¢
  (window follows price movement)
```

---

## Implementation Plan

### 1. Add Dynamic Reference Price to Mock Generator

**File:** `src/services/autoApi.ts`

Update `generateMockOrderBook()` to use a dynamic reference price that drifts over time:

```typescript
// Track price state between calls (simulates market movement)
let currentRefPrice = 0.50;

export function generateMockOrderBook(): OrderBookData {
  // Drift the reference price randomly by ±0.5¢ each tick
  const drift = (Math.random() - 0.5) * 0.01; // -0.5¢ to +0.5¢
  currentRefPrice = Math.max(0.20, Math.min(0.80, currentRefPrice + drift));
  
  const refPrice = Math.round(currentRefPrice * 100) / 100;
  const tick = 0.01;
  // ... rest of generation uses this dynamic refPrice
```

### 2. Update Best Prices to Match Reference

**File:** `src/services/autoApi.ts`

Update the `best` prices to be based on the dynamic reference:

```typescript
return {
  tick,
  refPrice,
  levels,
  best: {
    yesBid: Math.round((refPrice - 0.01) * 100) / 100,
    yesAsk: refPrice,
    noBid: Math.round((1 - refPrice) * 100) / 100,
    noAsk: Math.round((1 - refPrice + 0.01) * 100) / 100,
  },
  fee: { takerPct: 0.4, makerPct: 0.0 },
};
```

---

## Visual Result

```text
Tick 1: refPrice = 50¢
┌──────────────────────────────┐
│  Range: 47.5¢ - 52.5¢        │
│  ▓▓  52¢  │  ...             │
│  ▓▓  51¢  │  ...             │
│  ▓▓ ►50¢◄ │  ...  ← Current  │
│  ▓▓  49¢  │  ...             │
│  ▓▓  48¢  │  ...             │
└──────────────────────────────┘

Tick 50: refPrice drifted to 54¢
┌──────────────────────────────┐
│  Range: 51.3¢ - 56.7¢        │
│  ▓▓  56¢  │  ...             │
│  ▓▓  55¢  │  ...             │
│  ▓▓ ►54¢◄ │  ...  ← Current  │
│  ▓▓  53¢  │  ...             │
│  ▓▓  52¢  │  ...             │
└──────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/autoApi.ts` | Add module-level `currentRefPrice` variable that drifts each tick, update `generateMockOrderBook()` to use dynamic price, update `best` prices to match |

---

## Technical Notes

- Reference price drifts ±0.5¢ per 300ms tick (simulates market movement)
- Price is bounded between 20¢ and 80¢ to stay realistic
- The ±5% window automatically recalculates in `useAutoOrderBook.ts` since it uses `orderBook.refPrice`
- No changes needed to the hook - it already reads `refPrice` from the order book data

