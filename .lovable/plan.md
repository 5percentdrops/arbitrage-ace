

# Show Arbitrage Percentage Per Row on the Ladder

## Overview

Display the actual arbitrage percentage (net edge %) on each row where arbitrage is found, replacing the generic probability percentage that currently shows.

## Changes

### 1. Update BetAngelPriceCell to Accept Edge Info

**File: `src/components/trading/auto/BetAngelPriceCell.tsx`**

Add a new optional `edgePct` prop to display the arbitrage percentage when a level is profitable:

```tsx
interface BetAngelPriceCellProps {
  price: number;
  isLTP?: boolean;
  momentum?: PriceMomentum;
  isProfitable?: boolean;
  edgePct?: number;  // NEW: Net edge percentage for this level
  onClick?: () => void;
}
```

Update the display logic:
- When `isProfitable` is true and `edgePct` is provided, show the edge percentage (e.g., "+1.85%") instead of the generic probability
- Style it prominently in green to indicate the arb opportunity
- Keep the price in cents as the main display

Visual result for a profitable row:
```
+-------------+
|    48¢      |  <- Price in cents
|  +1.85%     |  <- Arb edge % (green, instead of "48%")
+-------------+
```

For non-profitable rows, continue showing the probability:
```
+-------------+
|    52¢      |
|    52%      |
+-------------+
```

### 2. Pass Edge Info from BetAngelLadder to PriceCell

**File: `src/components/trading/auto/BetAngelLadder.tsx`**

Look up the edge info for each level and pass it to `BetAngelPriceCell`:

```tsx
// Inside the levels.map() around line 91-100
const levelEdge = levelEdges.get(level.price);

// Then pass to BetAngelPriceCell around line 133-138
<BetAngelPriceCell
  price={price}
  isLTP={isLTP}
  momentum={momentum}
  isProfitable={isProfitable}
  edgePct={isProfitable ? levelEdge?.netEdgePct : undefined}  // NEW
  onClick={() => onPriceClick(level.price)}
/>
```

## Visual Result

Before (current):
```
+-------+-------+-------+
| Buy   | 48¢   | Sell  |   <- Profitable row
|       | 48%   |       |   <- Shows probability
+-------+-------+-------+
```

After (proposed):
```
+-------+-------+-------+
| Buy   | 48¢   | Sell  |   <- Profitable row
|       |+1.85% |       |   <- Shows ARB edge % in green
+-------+-------+-------+
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/trading/auto/BetAngelPriceCell.tsx` | Add `edgePct` prop, display arb % when profitable |
| `src/components/trading/auto/BetAngelLadder.tsx` | Look up edge info and pass `edgePct` to price cell |

