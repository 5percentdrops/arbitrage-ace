
# Position Size Input + Tiered 7-Row Selection

## Overview
Add a **Position Size** input field to the Order Ladder page, and when clicking a profitable row, automatically select **7 profitable rows** with **tiered position sizing** (largest allocation to best edge, decreasing allocation as edge decreases).

## Current Behavior
- Size input exists in `SpreadCalculator` but it's labeled "Shares" and distributes evenly
- When clicking a profitable row, orders are created with `sharesPerLevel = size / numLevels` (uniform distribution)
- No visual indicator showing which rows will be selected before clicking

## New Behavior
1. Add prominent **Position Size (USD)** input in the header or sidebar
2. When clicking a profitable row:
   - Select the **top 7 profitable levels** (sorted by `netEdgePct`)
   - Apply **tiered sizing** (e.g., L1 gets 25%, L2 gets 18%, L3 gets 15%, etc.)
   - Visually highlight all 7 selected rows before deploying
3. Show a preview of allocation before execution

---

## Implementation Steps

### 1. Add Position Size Input to Header
**File:** `src/components/trading/auto/AutoLadder.tsx`

Add a dedicated position size input in the card header area next to the controls:

```tsx
<div className="flex items-center gap-2">
  <Label className="text-xs text-muted-foreground">Position Size (USD)</Label>
  <Input
    type="number"
    min={10}
    value={positionSize}
    onChange={(e) => setPositionSize(Number(e.target.value))}
    className="w-24 h-8 font-mono"
  />
</div>
```

### 2. Add Tiered Distribution Logic
**File:** `src/components/trading/auto/AutoLadder.tsx`

Create tiered allocation weights that favor higher-edge opportunities:

```typescript
// Tiered distribution - L1 (best edge) gets most, L7 gets least
const TIER_WEIGHTS = [0.25, 0.18, 0.15, 0.13, 0.11, 0.10, 0.08]; // = 1.00

function calculateTieredShares(totalSize: number, numLevels: number): number[] {
  const weights = TIER_WEIGHTS.slice(0, numLevels);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => Math.floor((w / totalWeight) * totalSize));
}
```

### 3. Track Selected Rows for Visual Preview
**File:** `src/components/trading/auto/AutoLadder.tsx`

Add state to track which rows would be selected:

```typescript
const [previewPrices, setPreviewPrices] = useState<Set<number>>(new Set());
```

When hovering over a profitable row, calculate and highlight the 7 rows that would be selected.

### 4. Update handleArbLevelClick
**File:** `src/components/trading/auto/AutoLadder.tsx`

Modify the click handler to use tiered sizing:

```typescript
const handleArbLevelClick = useCallback(async (clickedPrice: number) => {
  const clickedEdge = levelEdges.get(clickedPrice);
  if (!clickedEdge?.isProfitable) return;
  
  // Get top 7 profitable levels, sorted by edge
  const profitableLevelsSorted = Array.from(levelEdges.entries())
    .filter(([_, edge]) => edge.isProfitable)
    .sort((a, b) => b[1].netEdgePct - a[1].netEdgePct)
    .slice(0, 7);
  
  // Calculate tiered shares allocation
  const tierShares = calculateTieredShares(positionSize, profitableLevelsSorted.length);
  
  // Generate orders with tiered sizing
  const newOrders = profitableLevelsSorted.flatMap(([price, edge], index) => ([
    { side: 'YES', price, shares: tierShares[index], ladderIndex: index + 1, ... },
    { side: 'NO', price: 1 - price, shares: tierShares[index], ladderIndex: index + 1, ... },
  ]));
  
  setDeployedOrders(prev => [...prev, ...newOrders]);
}, [levelEdges, positionSize]);
```

### 5. Update LadderRow for Selection Preview
**File:** `src/components/trading/auto/LadderRow.tsx`

Add props for selection preview and tier label:

```typescript
interface LadderRowProps {
  // ... existing props
  isInPreview?: boolean;  // Highlighted as part of upcoming selection
  previewTier?: number;   // L1, L2, etc. preview
  tierAllocation?: number; // Show allocation in preview
}
```

Add visual styling for previewed rows:

```tsx
<div className={cn(
  // ... existing classes
  isInPreview && "ring-2 ring-primary/50 bg-primary/5"
)}>
  {isInPreview && previewTier && (
    <div className="absolute left-0 text-[9px] bg-primary text-primary-foreground px-1 rounded-r">
      L{previewTier}: ${tierAllocation}
    </div>
  )}
</div>
```

### 6. Add Hover Preview Logic
**File:** `src/components/trading/auto/AutoLadder.tsx`

When hovering over any profitable row, show which 7 rows would be selected:

```typescript
const handleRowHover = useCallback((price: number | null) => {
  if (!price || !levelEdges.get(price)?.isProfitable) {
    setPreviewPrices(new Set());
    return;
  }
  
  // Get top 7 profitable levels
  const top7 = Array.from(levelEdges.entries())
    .filter(([_, edge]) => edge.isProfitable)
    .sort((a, b) => b[1].netEdgePct - a[1].netEdgePct)
    .slice(0, 7)
    .map(([p]) => p);
  
  setPreviewPrices(new Set(top7));
}, [levelEdges]);
```

---

## Visual Design

### Header with Position Size
```text
+----------------------------------------------------------------+
| BTC Order Book Ladder    [Position Size: $___] [Pause] [⟳]    |
| Tick: 0.01 | Range: 0.40-0.60     ☑ Arb Only                   |
+----------------------------------------------------------------+
```

### Tiered Allocation Preview (on hover)
```text
| L1 (25%) | 0.48 | ... edge +2.1% ... |     | 0.52 | L1 (25%) |  ← Best edge
| L2 (18%) | 0.49 | ... edge +1.8% ... |     | 0.51 | L2 (18%) |
| L3 (15%) | 0.47 | ... edge +1.5% ... |     | 0.53 | L3 (15%) |
|   ...    |      |                    |     |      |   ...    |
| L7 (8%)  | 0.46 | ... edge +0.6% ... |     | 0.54 | L7 (8%)  |  ← Minimum edge
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/trading/auto/AutoLadder.tsx` | Add positionSize state, tiered distribution logic, hover preview |
| `src/components/trading/auto/LadderRow.tsx` | Add preview styling, tier labels, allocation display |
| `src/types/auto-trading.ts` | Add TieredAllocation type (optional) |

---

## Technical Details

### Tier Weight Distribution
| Tier | Weight | Example ($1000 total) |
|------|--------|----------------------|
| L1 (Best) | 25% | $250 |
| L2 | 18% | $180 |
| L3 | 15% | $150 |
| L4 | 13% | $130 |
| L5 | 11% | $110 |
| L6 | 10% | $100 |
| L7 | 8% | $80 |
| **Total** | **100%** | **$1000** |

### Edge Cases
- **Fewer than 7 profitable levels**: Redistribute weights proportionally among available levels
- **Position size too small**: Show warning if any tier would be < minimum order size
- **No profitable levels**: Disable click interaction, show message
