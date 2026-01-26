

# Enhanced Order Book Ladder: Spreads and Arbitrage Highlighting

## Overview

This plan enhances the Auto Trading order book ladder to:
1. Display spread information (gross edge, net edge, total cost) in the middle column for each price level
2. Highlight both YES and NO cells in green when an arbitrage opportunity exists at that level

## Current State

The middle column currently shows only a simple "EDGE" badge when a level is profitable. The entire row gets a light green background, but individual YES/NO cells are not distinctly highlighted.

## Changes

### 1. Update LadderRow Component

Modify the middle separator section to display detailed spread information:
- **Spread** (YES Ask + NO Ask): Shows total cost to enter the arbitrage
- **Gross Edge**: Raw profit margin (1.0 - total cost)
- **Net Edge**: After fees (displayed as percentage)

Color-code based on profitability:
- Green text/background when net edge meets threshold
- Muted/neutral when not profitable

### 2. Enhanced Cell Highlighting

When a level is profitable (arbitrage exists):
- Apply green ring/border to both the YES Ask cell and NO Ask cell
- Add subtle green glow effect to make it visually prominent
- Keep the green background on the entire row for context

### 3. Pass Edge Data to Each Row

Calculate and pass spread/edge data for each level from AutoLadder to LadderRow so the middle column can display accurate numbers.

## Visual Design

```text
+----------+------+----------+-------------------------+----------+------+----------+
| Bid Size | YES  | Ask Size |         SPREAD          | Bid Size |  NO  | Ask Size |
+----------+------+----------+-------------------------+----------+------+----------+
|   150    | 0.52 |   [200]  |  Cost: 0.98 | Edge: +2% |   [180]  | 0.46 |   120    |
+----------+------+----------+-------------------------+----------+------+----------+
                     ^^^^                                  ^^^^
                  Green ring                            Green ring
                  (arb found)                           (arb found)
```

The middle column will show:
- Total cost (YES + NO price)
- Net edge percentage (positive = profitable)
- Green highlight when above threshold

---

## Technical Details

### File: `src/types/auto-trading.ts`

Add a new interface for level-specific edge data:

```typescript
export interface LevelEdgeInfo {
  totalCost: number;
  grossEdgePct: number;
  netEdgePct: number;
  isProfitable: boolean;
}
```

### File: `src/hooks/useAutoOrderBook.ts`

Add a new return value `levelEdges` - a Map from price to edge info:

```typescript
// Add to return interface
levelEdges: Map<number, LevelEdgeInfo>;

// Calculate in the hook
const levelEdges = new Map<number, LevelEdgeInfo>();
if (orderBook) {
  orderBook.levels.forEach(level => {
    const yesAsk = level.price;
    const noAsk = 1 - level.price;
    const totalCost = yesAsk + noAsk;
    const grossEdge = 1.0 - totalCost;
    const grossEdgePct = grossEdge * 100;
    const fee = orderBook.fee.takerPct / 100;
    const netEdge = grossEdge - (fee * 2);
    const netEdgePct = netEdge * 100;
    
    levelEdges.set(level.price, {
      totalCost,
      grossEdgePct,
      netEdgePct,
      isProfitable: netEdgePct >= minNetEdgePct,
    });
  });
}
```

### File: `src/components/trading/auto/LadderRow.tsx`

Update props to receive edge info and enhance the UI:

```typescript
interface LadderRowProps {
  level: OrderBookLevel;
  edgeInfo: LevelEdgeInfo | null;  // NEW
  isSelected: boolean;
  isProfitable: boolean;
  // ... rest
}
```

Update the middle column to show spread details:

```tsx
{/* Middle Column - Spread/Edge Info */}
<div className="col-span-3 flex items-center justify-center gap-2 bg-muted/20 px-2">
  {edgeInfo && (
    <>
      <span className={cn(
        "text-[10px] font-mono",
        edgeInfo.isProfitable ? "text-success" : "text-muted-foreground"
      )}>
        {edgeInfo.totalCost.toFixed(3)}
      </span>
      <span className={cn(
        "text-[10px] font-bold px-1.5 py-0.5 rounded",
        edgeInfo.isProfitable 
          ? "bg-success/20 text-success" 
          : "text-muted-foreground"
      )}>
        {edgeInfo.netEdgePct >= 0 ? '+' : ''}{edgeInfo.netEdgePct.toFixed(2)}%
      </span>
    </>
  )}
</div>
```

Update the Ask cells to have green highlighting when profitable:

```tsx
<Cell
  value={level.yesAsk}
  type="ask"
  side="YES"
  isProfitable={isProfitable}  // NEW prop
  onClick={() => onYesClick('ask')}
  orders={[]}
/>
```

Update Cell component to show green ring/glow when profitable:

```tsx
function Cell({ value, type, side, isPrice, isProfitable, className, onClick, orders = [] }) {
  // ... existing logic
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "py-1.5 px-2 text-center tabular-nums cursor-pointer relative",
        // ... existing classes
        isProfitable && type === 'ask' && "ring-2 ring-success bg-success/10",
        className
      )}
    >
      {/* ... existing content */}
    </div>
  );
}
```

### File: `src/components/trading/auto/AutoLadder.tsx`

Pass levelEdges to each LadderRow:

```tsx
const { levelEdges, /* ...other */ } = useAutoOrderBook({ marketId, minNetEdgePct });

// In the map:
<LadderRow
  key={level.price}
  level={level}
  edgeInfo={levelEdges.get(level.price) ?? null}
  // ... rest of props
/>
```

Update the header row to reflect new middle column:

```tsx
<div className="col-span-3 py-2 px-2 text-center">
  <span className="mr-2">Cost</span>
  <span>Net Edge</span>
</div>
```

## Summary of Files to Modify

1. **`src/types/auto-trading.ts`** - Add `LevelEdgeInfo` interface
2. **`src/hooks/useAutoOrderBook.ts`** - Calculate and return `levelEdges` Map
3. **`src/components/trading/auto/LadderRow.tsx`** - Display spread in middle, highlight Ask cells
4. **`src/components/trading/auto/AutoLadder.tsx`** - Pass edge info to rows, update header

