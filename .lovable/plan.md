
# Enhanced Spread/Arbitrage Indicator Between YES and NO Ladders

## Overview

Currently, the `SpreadIndicator` between the YES and NO ladders uses the midpoint price for calculations, which doesn't reflect actual arbitrage opportunities. You want to show the real available arbitrage percentage when opportunities exist and make the spread indicator more prominent.

## Changes

### 1. Update SpreadIndicator Props and Logic

**File: `src/components/trading/auto/SpreadIndicator.tsx`**

Enhance the component to accept and display real arbitrage data:

- Add optional `bestArbPct` prop for the actual best arbitrage percentage
- Add optional `hasArbitrage` prop to indicate if any arb opportunities exist
- Add the count of profitable levels if available
- Make the indicator more visually prominent when arbitrage is found

```tsx
interface SpreadIndicatorProps {
  yesBestAsk: number;
  noBestAsk: number;
  bestArbPct?: number;      // Actual best arb percentage from level edges
  arbLevelCount?: number;   // Number of profitable levels available
}
```

The component will:
- Show "Arb: +X.XX%" with the actual best arbitrage percentage when available
- Display the number of profitable arb levels (e.g., "7 levels")
- Use a more prominent visual style with a pulsing glow effect when arb is available
- Fall back to spread display when no arbitrage exists

### 2. Pass Best Arbitrage Data to SpreadIndicator

**File: `src/components/trading/auto/AutoLadder.tsx`**

Update the `SpreadIndicator` usage around line 706-710 to pass the real arbitrage data:

- Pass `bestArb?.edge.netEdgePct` as the actual best arbitrage percentage
- Pass `profitableLevels.size` to show how many arb levels exist
- This ensures the indicator reflects real-time arbitrage opportunities

## Visual Result

When no arbitrage:
```
+-------------------+
|   Spread: 2¢      |
|   52¢ + 50¢ = 102¢|
+-------------------+
```

When arbitrage available:
```
+-------------------+
|   Arb: +1.85%     |  <- Glowing green, prominent
|   7 levels        |
|   48¢ + 50¢ = 98¢ |
+-------------------+
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/trading/auto/SpreadIndicator.tsx` | Add `bestArbPct` and `arbLevelCount` props, enhance styling for arb opportunities |
| `src/components/trading/auto/AutoLadder.tsx` | Pass `bestArbPct` and `arbLevelCount` from `bestArb` and `profitableLevels` to SpreadIndicator |
