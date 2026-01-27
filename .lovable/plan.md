

# Row Selection Arbitrage Pairing System

## Summary

Remove the "Buy Yes"/"Buy No" buttons and implement row-based order placement where clicking an arbitrage-highlighted row automatically pairs a matching amount on the opposite side, ensuring the total cost is always below $1.00.

---

## Current Behavior vs New Behavior

```text
CURRENT:
┌────────────────────────────────────────────────────────┐
│  YES Ladder                    NO Ladder               │
│  Click row → highlights        Click row → highlights  │
│                                                        │
│  [Buy Yes @ 52¢]    [Buy No @ 48¢]   ← Remove these   │
└────────────────────────────────────────────────────────┘

NEW BEHAVIOR:
┌────────────────────────────────────────────────────────┐
│  YES Ladder                    NO Ladder               │
│  Row 48¢ (arb) ← Click                                 │
│       ↓                              ↓                 │
│  Auto-selects YES @ 48¢     Auto-pairs NO @ 51¢       │
│       ↓                              ↓                 │
│  Total: 48¢ + 51¢ = 99¢ (< $1.00) ✓                   │
│       ↓                                                │
│  Deploy paired orders with $125 each (from stake)     │
└────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### 1. Remove QuickTradeButtons Component

**File:** `src/components/trading/auto/AutoLadder.tsx`

- Remove the import for `QuickTradeButtons`
- Remove the `<QuickTradeButtons ... />` component at lines 512-520

### 2. Add Paired Selection State

**File:** `src/components/trading/auto/AutoLadder.tsx`

Add new state to track paired selections:

```typescript
interface PairedArbSelection {
  yesPrice: number;
  noPrice: number;
  totalCost: number;
  edgePct: number;
  yesAllocation: number;
  noAllocation: number;
}

const [pairedSelection, setPairedSelection] = useState<PairedArbSelection | null>(null);
```

### 3. Modify Row Click Handler for Arbitrage Pairing

**File:** `src/components/trading/auto/AutoLadder.tsx`

Update `handlePriceClick` to:
1. Check if clicked row is profitable (arb opportunity)
2. Find the corresponding NO price that pairs with this YES price
3. Calculate allocation ensuring total < $1.00
4. Show visual pairing on both ladders
5. On second click (confirmation), deploy the paired orders

```typescript
const handleArbRowClick = useCallback((clickedPrice: number, clickedSide: 'YES' | 'NO') => {
  const edge = levelEdges.get(clickedPrice);
  if (!edge?.isProfitable) return;
  
  // Get actual prices from the level
  const level = orderBook?.levels.find(l => l.price === clickedPrice);
  if (!level) return;
  
  const yesPrice = level.yesAskPrice;
  const noPrice = level.noAskPrice;
  const totalCost = yesPrice + noPrice;
  
  // Only proceed if total < $1.00 (arb exists)
  if (totalCost >= 1.0) return;
  
  // Calculate allocation: split stake evenly between YES and NO
  // Each leg gets half the stake
  const perLegAllocation = Math.floor(positionSize / 2);
  
  setPairedSelection({
    yesPrice,
    noPrice,
    totalCost,
    edgePct: edge.netEdgePct,
    yesAllocation: perLegAllocation,
    noAllocation: perLegAllocation,
  });
  
  // Highlight both sides in preview
  const previewMap = new Map<number, { tier: number; allocation: number }>();
  previewMap.set(clickedPrice, { tier: 1, allocation: perLegAllocation });
  setPreviewPrices(previewMap);
}, [levelEdges, orderBook, positionSize]);
```

### 4. Add Confirmation Click Handler

When a row is already selected (in preview), clicking it again deploys the paired orders:

```typescript
const handleConfirmPairedOrder = useCallback(async () => {
  if (!pairedSelection) return;
  
  setIsDeploying(true);
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newOrders: ActiveLadderOrder[] = [
      {
        id: `order-${Date.now()}-yes`,
        ladderIndex: 1,
        side: 'YES',
        price: pairedSelection.yesPrice,
        shares: pairedSelection.yesAllocation,
        filledShares: 0,
        fillPercent: 0,
        status: 'pending',
      },
      {
        id: `order-${Date.now()}-no`,
        ladderIndex: 1,
        side: 'NO',
        price: pairedSelection.noPrice,
        shares: pairedSelection.noAllocation,
        filledShares: 0,
        fillPercent: 0,
        status: 'pending',
      },
    ];
    
    setDeployedOrders(prev => [...prev, ...newOrders]);
    setPairedSelection(null);
    setPreviewPrices(new Map());
    
    toast({
      title: "Paired Arb Order Deployed",
      description: `YES @ ${Math.round(pairedSelection.yesPrice * 100)}¢ + NO @ ${Math.round(pairedSelection.noPrice * 100)}¢ = ${Math.round(pairedSelection.totalCost * 100)}¢`,
    });
  } finally {
    setIsDeploying(false);
  }
}, [pairedSelection]);
```

### 5. Update BetAngelLadder for Paired Highlighting

**File:** `src/components/trading/auto/BetAngelLadder.tsx`

Add props to show paired selection on both ladders:

```typescript
interface BetAngelLadderProps {
  // ... existing props
  pairedSelection?: PairedArbSelection | null;
  onRowClick: (price: number) => void;
  onConfirmClick?: () => void;
}
```

Update row rendering to show:
- Primary selection highlight on clicked row
- Secondary paired highlight on corresponding row in opposite ladder
- "Click to confirm" indicator when row is selected

### 6. Add Paired Selection Summary Banner

**File:** `src/components/trading/auto/AutoLadder.tsx`

Show a summary between the ladders when a pair is selected:

```typescript
{pairedSelection && (
  <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
    <div className="text-xs text-success font-medium mb-1">
      Paired Arbitrage Ready
    </div>
    <div className="font-mono text-sm">
      <span className="text-[hsl(var(--poly-yes))]">
        YES @ {Math.round(pairedSelection.yesPrice * 100)}¢
      </span>
      {' + '}
      <span className="text-[hsl(var(--poly-no))]">
        NO @ {Math.round(pairedSelection.noPrice * 100)}¢
      </span>
      {' = '}
      <span className="font-bold text-success">
        {Math.round(pairedSelection.totalCost * 100)}¢
      </span>
    </div>
    <div className="text-xs text-muted-foreground mt-1">
      Edge: +{pairedSelection.edgePct.toFixed(2)}% | 
      ${pairedSelection.yesAllocation} + ${pairedSelection.noAllocation}
    </div>
    <Button
      size="sm"
      onClick={handleConfirmPairedOrder}
      disabled={isDeploying}
      className="mt-2 bg-success hover:bg-success/90"
    >
      {isDeploying ? 'Deploying...' : 'Confirm Order Pair'}
    </Button>
  </div>
)}
```

---

## Visual Flow After Changes

```text
Step 1: User sees profitable rows highlighted in green
┌─────────────────────────────────────────────────────────┐
│    YES LADDER                      NO LADDER            │
│  Buy  │ 52¢ │ Sell      SPREAD    Buy  │ 48¢ │ Sell    │
│  ▓▓▓  │ 51¢ │  42        2¢       38   │ 49¢ │ ▓▓▓     │
│  ▓▓   │►48¢◄│  65    [Arb: +1%]   52   │►51¢◄│ ▓▓      │  ← Green = arb
│  ▓    │ 47¢ │  89                 71   │ 52¢ │ ▓       │
└─────────────────────────────────────────────────────────┘

Step 2: User clicks YES @ 48¢ row
┌─────────────────────────────────────────────────────────┐
│    YES LADDER                      NO LADDER            │
│  ▓▓   │►48¢◄│  65  ←SELECTED→   52   │►51¢◄│ ▓▓       │
│        ╔══════════════════════════════════╗             │
│        ║  Paired Arb: 48¢ + 51¢ = 99¢    ║             │
│        ║  Edge: +1.2%  |  $125 + $125    ║             │
│        ║     [Confirm Order Pair]        ║             │
│        ╚══════════════════════════════════╝             │
└─────────────────────────────────────────────────────────┘

Step 3: User clicks "Confirm" → Orders deployed
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/trading/auto/AutoLadder.tsx` | Remove QuickTradeButtons, add paired selection state, update click handlers, add confirmation banner |
| `src/components/trading/auto/BetAngelLadder.tsx` | Update to show paired highlighting on both ladders |
| `src/types/auto-trading.ts` | Add `PairedArbSelection` interface |

### File to Delete

| File | Reason |
|------|--------|
| `src/components/trading/auto/QuickTradeButtons.tsx` | No longer needed - orders placed via row selection |

---

## Technical Details

### Arbitrage Constraint Validation

Every paired order MUST satisfy: `yesPrice + noPrice < 1.00`

```typescript
const isValidArb = (yesPrice: number, noPrice: number): boolean => {
  return yesPrice + noPrice < 1.0;
};
```

### Allocation Logic

Split the position size evenly between YES and NO legs:
- Total stake: $250
- YES allocation: $125
- NO allocation: $125
- Each wins $125 profit when market resolves (guaranteed arbitrage)

### Click State Machine

```text
State 1: No selection
  → Click profitable row → State 2

State 2: Row selected (preview shown)
  → Click "Confirm" → Deploy orders → State 1
  → Click different row → Update selection → State 2
  → Click cancel/X → State 1
```

