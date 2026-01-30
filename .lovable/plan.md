

# Drag Limit Orders with Arbitrage Preview

## Overview
Enable dragging limit orders up and down within the order book ladder with:
1. **Constraint**: Same side (YES/NO) AND same column (Buy/Sell) - no cross-over allowed
2. **Live Arb Preview**: While dragging over a row, show the calculated arbitrage % at that price level (can be positive or negative)
3. **Accept on Drop**: Only when user releases the drag does the order actually move

## Visual Flow

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           DRAG PREVIEW FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. USER STARTS DRAG                 2. HOVER OVER NEW ROW              │
│  ┌──────────────────────┐            ┌──────────────────────┐           │
│  │ Buy  │ Price │ Sell  │            │ Buy  │ Price │ Sell  │           │
│  ├──────┼───────┼───────┤            ├──────┼───────┼───────┤           │
│  │[L1]  │  52¢  │       │ ← Grab     │      │  51¢  │       │           │
│  │  ↓   │       │       │            │ ╔════╧═══════╧═════╗ │           │
│  │ 50%  │       │       │            │ ║ Drop here: +1.2% ║ │ ← Preview │
│  │ opac │       │       │            │ ╚══════════════════╝ │           │
│  └──────┴───────┴───────┘            │ [L2] │  50¢  │       │           │
│                                      └──────┴───────┴───────┘           │
│                                                                         │
│  3. USER DROPS (ACCEPT)              4. ORDER MOVED                     │
│  ┌──────────────────────┐            ┌──────────────────────┐           │
│  │ Buy  │ Price │ Sell  │            │ Buy  │ Price │ Sell  │           │
│  ├──────┼───────┼───────┤            ├──────┼───────┼───────┤           │
│  │      │  52¢  │       │            │      │  52¢  │       │           │
│  │[L1]  │  51¢  │       │ ← Dropped  │[L1]  │  51¢  │       │ ← Moved   │
│  │[L2]  │  50¢  │       │            │[L2]  │  50¢  │       │           │
│  └──────┴───────┴───────┘            └──────┴───────┴───────┘           │
│                                                                         │
│  Toast: "Moved L1 from 52¢ to 51¢ (+1.2% arb)"                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Drag Constraints (No Cross-Over)

| Order Location | Can Drop To |
|----------------|-------------|
| YES Buy column | Only YES Buy column (different rows) |
| YES Sell column | Only YES Sell column (different rows) |
| NO Buy column | Only NO Buy column (different rows) |
| NO Sell column | Only NO Sell column (different rows) |

Invalid drops (wrong side or column) are visually rejected with no highlight.

## Implementation Details

### 1. Update ActiveLadderOrder Type

**File:** `src/types/auto-trading.ts`

Add `orderType` to track which column the order belongs to:

```typescript
export interface ActiveLadderOrder {
  // ... existing fields
  orderType: 'back' | 'lay';  // Which column: back=Buy, lay=Sell
}
```

### 2. Add Drag State and Handler to AutoLadder

**File:** `src/components/trading/auto/AutoLadder.tsx`

Add new state for tracking drag preview:

```typescript
const [dragPreview, setDragPreview] = useState<{
  orderId: string;
  orderSide: 'YES' | 'NO';
  orderType: 'back' | 'lay';
  targetLevelPrice: number;
  arbPct: number;  // Can be positive or negative
} | null>(null);
```

Add handler to calculate arb % when dragging over a row:

```typescript
const handleDragOver = useCallback((
  orderId: string,
  orderSide: 'YES' | 'NO',
  orderType: 'back' | 'lay',
  targetLevelPrice: number,
  targetSide: 'YES' | 'NO',
  targetType: 'back' | 'lay'
) => {
  // Validate constraints - same side AND same column
  if (orderSide !== targetSide || orderType !== targetType) {
    setDragPreview(null);
    return;
  }
  
  // Calculate arb % at new price level
  const level = orderBook?.levels.find(l => Math.abs(l.price - targetLevelPrice) < 0.005);
  if (!level) return;
  
  const totalCost = level.yesAskPrice + level.noAskPrice;
  const fee = orderBook?.fee.takerPct || 2;
  const netEdgePct = (1 - totalCost) * 100 - (fee / 100 * 2 * 100);
  
  setDragPreview({
    orderId,
    orderSide,
    orderType,
    targetLevelPrice,
    arbPct: netEdgePct,  // Could be negative
  });
}, [orderBook]);
```

Add handler to actually move order on drop:

```typescript
const handleOrderDrop = useCallback((
  orderId: string,
  newLevelPrice: number,
  targetSide: 'YES' | 'NO',
  targetType: 'back' | 'lay'
) => {
  const order = deployedOrders.find(o => o.id === orderId);
  if (!order) return;
  
  // Validate constraints
  if (order.side !== targetSide || order.orderType !== targetType) return;
  
  // Find new level
  const level = orderBook?.levels.find(l => Math.abs(l.price - newLevelPrice) < 0.005);
  if (!level) return;
  
  // Calculate new arb
  const totalCost = level.yesAskPrice + level.noAskPrice;
  const arbPct = ((1 - totalCost) * 100) - ((orderBook?.fee.takerPct || 2) * 2);
  
  // Update order
  setDeployedOrders(prev => prev.map(o => {
    if (o.id !== orderId) return o;
    return {
      ...o,
      price: order.side === 'YES' ? level.yesAskPrice : level.noAskPrice,
      levelPrice: newLevelPrice,
      arbAmount: (1 - totalCost) * o.shares,
    };
  }));
  
  toast({
    title: "Order Moved",
    description: `${order.ladderIndex ? `L${order.ladderIndex}` : 'Order'} moved to ${Math.round(newLevelPrice * 100)}¢ (${arbPct >= 0 ? '+' : ''}${arbPct.toFixed(2)}% arb)`,
  });
  
  setDragPreview(null);
}, [deployedOrders, orderBook]);
```

Update order creation to include `orderType`:
- When creating orders in `handleCellClick`, `handleQuickDeploy`, and auto-deploy effect
- Add `orderType: 'back'` for buy-side orders, `orderType: 'lay'` for sell-side orders

### 3. Update BetAngelCell for Draggable Badges

**File:** `src/components/trading/auto/BetAngelCell.tsx`

Update props to support drag:

```typescript
interface BetAngelCellProps {
  // ... existing props
  orderId?: string;
  orderSide?: 'YES' | 'NO';
  levelPrice: number;
  onDragStart?: (orderId: string, side: 'YES' | 'NO', type: 'back' | 'lay') => void;
  onDragEnd?: () => void;
  onDragOver?: (levelPrice: number) => void;
  onDrop?: (levelPrice: number) => void;
  isDropTarget?: boolean;
  dropPreviewArbPct?: number;
}
```

Make badge draggable:

```tsx
{hasOrder && orderLabel && (
  <span
    draggable
    onDragStart={(e) => {
      e.dataTransfer.setData('orderId', orderId!);
      e.dataTransfer.setData('side', orderSide!);
      e.dataTransfer.setData('type', type);
      onDragStart?.(orderId!, orderSide!, type);
    }}
    onDragEnd={onDragEnd}
    className={cn(
      "absolute top-0.5 text-[8px] px-1 py-0.5 rounded font-bold z-20",
      "bg-primary text-primary-foreground cursor-grab active:cursor-grabbing",
      type === 'back' ? "right-0.5" : "left-0.5"
    )}
  >
    {orderLabel}
  </span>
)}
```

Add drop target handling to the cell:

```tsx
<div 
  onDragOver={(e) => { e.preventDefault(); onDragOver?.(levelPrice); }}
  onDragLeave={() => onDragLeave?.()}
  onDrop={(e) => {
    e.preventDefault();
    onDrop?.(levelPrice);
  }}
  className={cn(
    // ... existing classes
    isDropTarget && "ring-2 ring-success ring-inset"
  )}
>
  {/* Arb preview tooltip on drop target */}
  {isDropTarget && dropPreviewArbPct !== undefined && (
    <div className={cn(
      "absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap z-30",
      dropPreviewArbPct >= 0 
        ? "bg-success text-success-foreground" 
        : "bg-destructive text-destructive-foreground"
    )}>
      {dropPreviewArbPct >= 0 ? '+' : ''}{dropPreviewArbPct.toFixed(2)}%
    </div>
  )}
  {/* ... existing content */}
</div>
```

### 4. Update BetAngelLadder to Wire Up Drag Events

**File:** `src/components/trading/auto/BetAngelLadder.tsx`

Add new props:

```typescript
interface BetAngelLadderProps {
  // ... existing props
  dragPreview?: {
    orderId: string;
    targetLevelPrice: number;
    arbPct: number;
  } | null;
  onDragStart?: (orderId: string, side: 'YES' | 'NO', type: 'back' | 'lay') => void;
  onDragEnd?: () => void;
  onDragOver?: (orderId: string, side: 'YES' | 'NO', type: 'back' | 'lay', levelPrice: number, targetSide: 'YES' | 'NO', targetType: 'back' | 'lay') => void;
  onOrderDrop?: (orderId: string, levelPrice: number, side: 'YES' | 'NO', type: 'back' | 'lay') => void;
  autoTradeEnabled?: boolean;  // Disable dragging when auto mode is ON
}
```

Track active drag state locally and pass to cells:

```typescript
const [activeDrag, setActiveDrag] = useState<{
  orderId: string;
  side: 'YES' | 'NO';
  type: 'back' | 'lay';
} | null>(null);
```

Pass appropriate props to each `BetAngelCell`:

- `orderId` from the order at this row
- `orderSide` from the order
- `levelPrice` for this row
- `onDragStart` / `onDragEnd` / `onDragOver` / `onDrop` handlers
- `isDropTarget` = `dragPreview?.targetLevelPrice === level.price`
- `dropPreviewArbPct` = `dragPreview?.arbPct`
- Disable drag when `autoTradeEnabled` is true

## Visual Feedback Summary

| State | Visual |
|-------|--------|
| Order badge (resting) | `cursor: grab` on hover |
| Dragging | Badge 50% opacity, `cursor: grabbing` |
| Valid drop target | Green ring highlight + arb % tooltip above |
| Invalid target | No highlight (drop ignored) |
| Negative arb preview | Red tooltip showing negative % |
| Positive arb preview | Green tooltip showing positive % |
| After drop | Toast confirmation with new price and arb % |

## Files Changed

| File | Changes |
|------|---------|
| `src/types/auto-trading.ts` | Add `orderType: 'back' \| 'lay'` to ActiveLadderOrder |
| `src/components/trading/auto/AutoLadder.tsx` | Add drag state, handlers, update order creation with orderType |
| `src/components/trading/auto/BetAngelLadder.tsx` | Add drag/drop props, track active drag, pass to cells |
| `src/components/trading/auto/BetAngelCell.tsx` | Make badges draggable, add drop target styling, show arb preview tooltip |

## Disabled States

- Dragging is **disabled** when Auto mode is ON (orders are auto-managed)
- Dragging is **disabled** when orders are deploying or cancelling
- Drop is **rejected** if target is different side (YES↔NO) or different column (Buy↔Sell)

