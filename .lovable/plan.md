
# Fix Arbitrage Profitability Logic

## Problem
The current profitability logic relies on mock `_arbEdges` data instead of the **correct arbitrage rule**:

**An arbitrage opportunity is profitable when: YES_price + NO_price < $1.00 (minus fees)**

The correct formula should be:
- `totalCost = yesAskPrice + noAskPrice` (where noAskPrice = 1 - level.price for the corresponding NO side)
- `grossEdge = 1.0 - totalCost`
- `netEdge = grossEdge - (fee * 2)` (paying taker fee on both sides)
- `isProfitable = netEdge >= minNetEdgePct`

## Current (Incorrect) Logic
In `useAutoOrderBook.ts`, lines 83-106:
```typescript
// Get arb edges from mock data (or calculate from real data)
const arbEdges = (orderBook as OrderBookData & { _arbEdges?: Record<number, number> })._arbEdges || {};

orderBook.levels.forEach(level => {
  const hasArb = level.price in arbEdges;
  const grossEdge = hasArb ? arbEdges[level.price] : 0;  // ❌ Wrong - using fake mock data
  // ...
});
```

## Correct Logic
For each price level, we need to calculate the **actual arbitrage edge** by pairing:
- YES ask at `level.price`
- NO ask at the corresponding level (where NO price = `1 - level.price`)

```typescript
orderBook.levels.forEach(level => {
  const yesPrice = level.price;
  const noPrice = 1 - level.price;
  
  // Total cost to buy both YES and NO at this level
  const totalCost = yesPrice + noPrice;  // Should be < 1.0 for arb
  
  const grossEdge = 1.0 - totalCost;
  const grossEdgePct = grossEdge * 100;
  const fee = orderBook.fee.takerPct / 100;
  const netEdge = grossEdge - (fee * 2);
  const netEdgePct = netEdge * 100;
  const isProfitable = netEdgePct >= minNetEdgePct;
  
  levelEdges.set(level.price, {
    totalCost,
    grossEdgePct,
    netEdgePct,
    isProfitable,
  });
});
```

## Implementation Steps

### 1. Update useAutoOrderBook Hook
**File:** `src/hooks/useAutoOrderBook.ts`

Replace the mock `_arbEdges` logic with the correct calculation:

- Remove: the check for `_arbEdges` and the mock-based edge calculation
- Add: calculate `totalCost = yesPrice + noPrice` directly from level prices
- Keep: the net edge calculation (subtracting fees from both sides)

### 2. Update Mock Data Generator
**File:** `src/services/autoApi.ts`

- Remove the `_arbEdges` mock field
- The mock should generate realistic price levels where some naturally have YES + NO < 1.0

The mock data currently generates levels at the same price for both YES and NO sides, which means `price + (1 - price) = 1.0` exactly (no edge). To simulate real arb opportunities, we should generate independent YES and NO ask prices.

### 3. Update Type Definition (if needed)
**File:** `src/types/auto-trading.ts`

Ensure `LevelEdgeInfo.totalCost` represents the actual sum of YES + NO prices.

---

## Technical Details

### Arbitrage Math
```text
Example profitable level:
  YES ask = $0.48
  NO ask = $0.51 (at the complementary price level)
  
  Total Cost = $0.48 + $0.51 = $0.99
  Gross Edge = $1.00 - $0.99 = $0.01 (1%)
  Fees = 0.4% × 2 = 0.8%
  Net Edge = 1% - 0.8% = 0.2%
  
If minNetEdgePct = 0.5%, this would NOT be profitable.
If minNetEdgePct = 0.1%, this WOULD be profitable.
```

### Example NOT profitable:
```text
  YES ask = $0.50
  NO ask = $0.52
  
  Total Cost = $0.50 + $0.52 = $1.02
  Gross Edge = -$0.02 (-2%)
  
  NOT profitable (cost exceeds $1.00)
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useAutoOrderBook.ts` | Replace mock arbEdges logic with real YES + NO < 1 calculation |
| `src/services/autoApi.ts` | Update mock generator to create realistic arb scenarios with independent YES/NO ask prices |
