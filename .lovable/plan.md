
# Fix Arbitrage Logic - Make YES + NO Prices Independent

## Problem
The current arbitrage calculation always produces `totalCost = 1.0` because:
```typescript
const yesPrice = level.price;
const noPrice = 1 - level.price;
// totalCost = price + (1 - price) = 1.0 always!
```

This means **no levels will ever show as profitable**, breaking all the tiered selection and preview features.

## Solution
Generate **independent YES and NO ask prices** that can sum to less than $1.00. In real markets, arbitrage exists when market inefficiencies cause the combined ask prices to be below $1.00.

---

## Implementation Steps

### 1. Update Mock Data Generator
**File:** `src/services/autoApi.ts`

Generate levels with independent YES/NO ask prices that sometimes sum to less than $1.00:

```typescript
// For each price level, generate a slight discount on combined asks
// to create arbitrage opportunities
const yesAskPrice = level.price; // YES asks at the level price
const noAskPrice = 1 - level.price - randomDiscount; // NO asks slightly below complement

// Some levels will have discounts creating arb opportunities
```

**Changes:**
- Add a `yesAskPrice` and `noAskPrice` field to each level (or use existing yesAsk/noAsk as price values)
- Randomly create 3-7 levels where `yesAskPrice + noAskPrice < 1.0`
- The discount should be 1-4% gross edge to create realistic arb scenarios

### 2. Update Type Definition
**File:** `src/types/auto-trading.ts`

Add explicit ask price fields to `OrderBookLevel`:
```typescript
export interface OrderBookLevel {
  price: number;      // Reference price for this row
  yesBid: number;     // Size available at YES bid
  yesAsk: number;     // Size available at YES ask  
  yesAskPrice: number; // Actual YES ask price (may differ from level.price)
  noBid: number;      // Size available at NO bid
  noAsk: number;      // Size available at NO ask
  noAskPrice: number;  // Actual NO ask price (may differ from 1-price)
}
```

### 3. Update Hook Edge Calculation
**File:** `src/hooks/useAutoOrderBook.ts`

Use the actual ask prices instead of computed prices:
```typescript
orderBook.levels.forEach(level => {
  // Use actual ask prices, not computed from level.price
  const yesPrice = level.yesAskPrice ?? level.price;
  const noPrice = level.noAskPrice ?? (1 - level.price);
  
  const totalCost = yesPrice + noPrice;
  const grossEdge = 1.0 - totalCost;
  // ... rest of calculation
});
```

### 4. Update LadderRow Display
**File:** `src/components/trading/auto/LadderRow.tsx`

Display the actual ask prices instead of computed prices:
- YES price column shows `level.yesAskPrice`
- NO price column shows `level.noAskPrice`

---

## Mock Data Example

After the fix, levels will look like:
```typescript
{
  price: 0.50,           // Reference row
  yesBid: 150,
  yesAsk: 200,
  yesAskPrice: 0.49,     // Actual YES ask price
  noBid: 180,
  noAsk: 220,
  noAskPrice: 0.50,      // Actual NO ask price
  // totalCost = 0.49 + 0.50 = 0.99 → 1% gross edge!
}
```

For non-arb levels:
```typescript
{
  price: 0.55,
  yesAskPrice: 0.55,
  noAskPrice: 0.46,      // 0.55 + 0.46 = 1.01 → no arb
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/auto-trading.ts` | Add `yesAskPrice` and `noAskPrice` to `OrderBookLevel` |
| `src/services/autoApi.ts` | Generate independent ask prices with some arb opportunities |
| `src/hooks/useAutoOrderBook.ts` | Use actual ask prices for edge calculation |
| `src/components/trading/auto/LadderRow.tsx` | Display actual ask prices in price columns |

---

## Expected Result

After this fix:
- 3-7 levels will show as profitable (green glow)
- Hovering a profitable row will preview all 7 top arb levels with tier labels
- Clicking deploys tiered orders across the best opportunities
- Position size input distributes funds according to tier weights
