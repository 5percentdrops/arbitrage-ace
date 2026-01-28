

# Remove Middle Spread/Arb Indicator

## Overview

Remove the `SpreadIndicator` component positioned between the YES and NO ladders. Since each profitable row now displays its own arbitrage percentage directly in the price cell, the central indicator is redundant.

## Change

**File: `src/components/trading/auto/AutoLadder.tsx`**

Delete the entire center column div containing the SpreadIndicator (lines 704-715):

```tsx
// DELETE THIS ENTIRE BLOCK (lines 704-715):
{/* Center Spread Indicator + Paired Selection */}
<div className="hidden md:flex flex-col items-center pt-20 gap-4">
  <SpreadIndicator
    yesBestAsk={orderBook?.best.yesAsk ?? midpointPrice}
    noBestAsk={orderBook?.best.noAsk ?? (1 - midpointPrice)}
    bestArbPct={profitableLevels.size > 0 
      ? Math.max(...Array.from(levelEdges.values()).filter(e => e.isProfitable).map(e => e.netEdgePct))
      : undefined
    }
    arbLevelCount={profitableLevels.size}
  />
</div>
```

## Result

The YES and NO ladders will sit directly next to each other without any middle separator. Each row already shows its own arb percentage when profitable, so the central indicator is no longer needed.

| File | Change |
|------|--------|
| `src/components/trading/auto/AutoLadder.tsx` | Remove SpreadIndicator div block (lines 704-715) |

