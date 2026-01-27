

# Add Limit Orders Table Below Order Ladder

## Overview

Replace the current card-based order list (`AutoOrdersPanel`) with a proper table showing limit orders with columns: Filled, Shares, Price, and Arb Amount.

---

## Implementation Plan

### 1. Create New LimitOrdersTable Component

**File:** `src/components/trading/auto/LimitOrdersTable.tsx` (new file)

Create a table component with the following columns:

| Column | Description | Source |
|--------|-------------|--------|
| Tier | L1-L7 label | `order.ladderIndex` |
| Side | YES/NO | `order.side` |
| Filled | Progress (e.g., "25/100" or "25%") | `order.filledShares / order.shares` |
| Shares | Number of shares | `order.shares` |
| Price | Execution price | `order.price` |
| Arb Amount | Profit from arbitrage (1.00 - totalCost) * shares | Calculated from paired order prices |

Structure:
```text
┌──────┬──────┬─────────┬────────┬───────┬────────────┐
│ Tier │ Side │ Filled  │ Shares │ Price │ Arb Amount │
├──────┼──────┼─────────┼────────┼───────┼────────────┤
│ L1   │ YES  │ 25%     │ 100    │ 0.485 │ $1.25      │
│ L1   │ NO   │ 25%     │ 100    │ 0.505 │ $1.25      │
│ L2   │ YES  │ 0%      │ 80     │ 0.490 │ $0.96      │
│ L2   │ NO   │ 0%      │ 80     │ 0.502 │ $0.96      │
└──────┴──────┴─────────┴────────┴───────┴────────────┘
```

### 2. Update ActiveLadderOrder Type

**File:** `src/types/auto-trading.ts`

Add `arbAmount` field to track the potential profit per order:

```typescript
export interface ActiveLadderOrder {
  id: string;
  ladderIndex: number;
  side: 'YES' | 'NO';
  price: number;
  levelPrice: number;
  shares: number;
  filledShares: number;
  fillPercent: number;
  status: 'pending' | 'partial' | 'filled' | 'cancelled';
  arbAmount: number;  // NEW: Potential arb profit = (1 - totalCost) * shares
}
```

### 3. Calculate Arb Amount When Creating Orders

**File:** `src/components/trading/auto/AutoLadder.tsx`

When creating orders (auto-deploy, quick deploy, confirm paired), calculate and store the arb amount:

```typescript
const arbPerShare = 1 - (level.yesAskPrice + level.noAskPrice);
const arbAmount = arbPerShare * tierShares[index];

// Add to order:
arbAmount: arbAmount,
```

### 4. Replace AutoOrdersPanel with LimitOrdersTable

**File:** `src/components/trading/auto/AutoLadder.tsx`

Replace the `AutoOrdersPanel` usage with the new `LimitOrdersTable`:

```typescript
<LimitOrdersTable
  orders={deployedOrders}
  onCancelAll={handleCancelAll}
  onCancelOrder={handleCancelOrder}
  isCancelling={isCancelling}
/>
```

### 5. Add Table Below the Ladder

Position the table below the main ladder card so it's visible without scrolling to the side panel.

---

## Visual Design

```text
┌─────────────────────────────────────────────────────┐
│                   Order Ladder                       │
│  ┌───────────────────────────────────────────────┐  │
│  │  YES Ladder  │ Spread │  NO Ladder            │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  📋 Limit Orders (7)                    Cancel All  │
├──────┬──────┬─────────┬────────┬───────┬────────────┤
│ Tier │ Side │ Filled  │ Shares │ Price │ Arb Amount │
├──────┼──────┼─────────┼────────┼───────┼────────────┤
│ L1   │ YES  │ ████░░  │ 100    │ $0.49 │ $1.25      │
│ L1   │ NO   │ ████░░  │ 100    │ $0.50 │ $1.25      │
│ L2   │ YES  │ ░░░░░░  │ 80     │ $0.48 │ $0.96      │
│ ...  │      │         │        │       │            │
└──────┴──────┴─────────┴────────┴───────┴────────────┘
```

---

## Files to Modify/Create

| File | Action | Changes |
|------|--------|---------|
| `src/components/trading/auto/LimitOrdersTable.tsx` | Create | New table component with Filled, Shares, Price, Arb Amount columns |
| `src/types/auto-trading.ts` | Modify | Add `arbAmount` field to `ActiveLadderOrder` |
| `src/components/trading/auto/AutoLadder.tsx` | Modify | Calculate arbAmount when creating orders, add LimitOrdersTable below ladder |

---

## Technical Notes

- Arb Amount = `(1 - (yesPrice + noPrice)) * shares` per order
- For paired YES/NO orders at the same tier, the arb amount is the same
- The table uses the existing shadcn Table components for consistent styling
- Cancel button per row allows individual order cancellation
- Progress bar in Filled column shows visual fill percentage

