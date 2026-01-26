
# Auto-Deploy Ladder on Arbitrage Click

## Overview
When a user clicks on a profitable arbitrage opportunity in the order book, the system will automatically create a ladder of **7 limit orders** (the clicked level plus 6 more) across both YES and NO sides, but **only at profitable levels** that meet the minimum edge threshold.

## Current Behavior
- Clicking a row sets a selection (`yesSelection` or `noSelection`)
- User must manually click "Deploy 7-Order Ladder" in the SpreadCalculator panel
- Orders are generated with arbitrary price offsets (not checking profitability)

## New Behavior
1. User clicks on ANY cell of a **profitable row** (green highlighted)
2. System automatically finds **up to 7 profitable levels** from the order book
3. Deploys paired YES+NO orders at each profitable level
4. Only deploys at levels where `netEdgePct >= minNetEdgePct`

---

## Implementation Steps

### 1. Update AutoLadder Component
**File:** `src/components/trading/auto/AutoLadder.tsx`

- Add new callback `handleProfitableClick(price: number)` that triggers when clicking a profitable row
- Find the **top 7 profitable levels** (sorted by `netEdgePct` descending) from `levelEdges` map
- Generate paired orders (YES @ price + NO @ 1-price) for each profitable level
- Distribute the configured `size` across the ladder orders

```text
Click Logic Flow:
+------------------+       +----------------------+
| Click Arb Row    | ----> | Find 7 Best Arb      |
| (profitable=true)|       | Levels by netEdgePct |
+------------------+       +----------------------+
                                     |
                                     v
                           +----------------------+
                           | Generate Orders:     |
                           | - L1: Best edge      |
                           | - L2-L7: Next best   |
                           +----------------------+
                                     |
                                     v
                           +----------------------+
                           | Deploy to            |
                           | deployedOrders state |
                           +----------------------+
```

### 2. Add New Handler Function
Create `handleArbLevelClick` callback:

```typescript
const handleArbLevelClick = useCallback(async (clickedPrice: number) => {
  // Only proceed if this level is profitable
  const clickedEdge = levelEdges.get(clickedPrice);
  if (!clickedEdge?.isProfitable) return;
  
  // Get all profitable levels, sorted by edge (best first)
  const profitableLevelsSorted = Array.from(levelEdges.entries())
    .filter(([_, edge]) => edge.isProfitable)
    .sort((a, b) => b[1].netEdgePct - a[1].netEdgePct)
    .slice(0, 7); // Max 7 levels
  
  // Generate orders for each level
  const newOrders = profitableLevelsSorted.flatMap(([price, edge], index) => ([
    { side: 'YES', price, ladderIndex: index + 1, ... },
    { side: 'NO', price: 1 - price, ladderIndex: index + 1, ... }
  ]));
  
  setDeployedOrders(prev => [...prev, ...newOrders]);
}, [levelEdges, size, minNetEdgePct]);
```

### 3. Update LadderRow Props & Behavior
**File:** `src/components/trading/auto/LadderRow.tsx`

- Add new prop `onRowClick?: () => void` for clicking entire profitable row
- Make the middle "edge info" column clickable when profitable
- Add visual cue (cursor-pointer, hover effect) to indicate clickability on profitable rows

### 4. Connect Click Handler
Pass `handleArbLevelClick` to each `LadderRow`:

```typescript
<LadderRow
  ...
  onArbClick={() => handleArbLevelClick(level.price)}
/>
```

### 5. Visual Feedback
- When orders are deployed, show toast notification: "Deployed {n} paired orders across {n/2} arb levels"
- Highlight deployed levels in the ladder (already handled via `yesOrders`/`noOrders` matching)

---

## Technical Details

### Order Generation Logic
```text
For each profitable level (max 7):
  - YES order @ level.price, shares = size / numLevels
  - NO order @ (1 - level.price), shares = size / numLevels
  
Total orders = profitableLevels.length * 2 (capped at 14)
```

### Size Distribution
- Evenly distribute total `size` across all profitable levels
- Alternative: Weight by edge percentage (more shares on higher edge)

### Files Modified
| File | Changes |
|------|---------|
| `src/components/trading/auto/AutoLadder.tsx` | Add `handleArbLevelClick`, pass to LadderRow |
| `src/components/trading/auto/LadderRow.tsx` | Add `onArbClick` prop, make edge column clickable |

---

## Edge Cases Handled
- **Less than 7 profitable levels**: Deploy whatever is available
- **No profitable levels**: No action (should not happen if row is highlighted green)
- **Already deployed orders**: Append new orders to existing list
- **Click non-profitable row**: No action taken
