
# Remove Confirmation Step for One-Click Order Deployment

## Current Behavior

When you click on the order ladder:
- **Buy/Sell cells**: Deploy 7-tier orders instantly (correct)
- **Price cell** (center): Shows a confirmation banner with "Confirm" button (needs fix)

## Desired Behavior

Clicking any cell should immediately deploy orders without any confirmation step.

## Solution

Modify `handleArbRowClick` to deploy orders directly instead of setting a `pairedSelection` state for confirmation. The function will work like `handleCellClick` - immediately deploying the 7-tier arbitrage orders when a profitable level is clicked.

---

## Technical Changes

### File: `src/components/trading/auto/AutoLadder.tsx`

**1. Update `handleArbRowClick` function (lines 369-401):**

Replace the current implementation that sets `pairedSelection` with direct order deployment logic:

```typescript
// Handle row click for instant arbitrage deployment
const handleArbRowClick = useCallback((clickedPrice: number) => {
  const edge = levelEdges.get(clickedPrice);
  if (!edge?.isProfitable) return;
  
  // Get actual prices from the level
  const level = orderBook?.levels.find(l => l.price === clickedPrice);
  if (!level) return;
  
  // Deploy immediately using handleCellClick logic
  handleCellClick(clickedPrice, 'YES', 'ask');
}, [levelEdges, orderBook, handleCellClick]);
```

**2. Remove unused confirmation-related code:**

- Remove `pairedSelection` state (line 46)
- Remove `handleConfirmPairedOrder` function (lines 403-452)
- Remove `handleClearSelection` function (lines 454-458)
- Remove the "Paired Selection Summary Banner" UI (lines 786-829)
- Remove the "Mobile Paired Selection Banner" UI (lines 848-882)
- Remove `pairedSelection` prop from both `BetAngelLadder` components

**3. Clean up `BetAngelLadder.tsx`:**

- Remove `pairedSelection` prop and related highlight logic since it's no longer needed

---

## Summary

| File | Change |
|------|--------|
| `src/components/trading/auto/AutoLadder.tsx` | Remove confirmation flow - clicking any cell deploys orders instantly |
| `src/components/trading/auto/BetAngelLadder.tsx` | Remove `pairedSelection` prop and paired highlight styling |

After this change, clicking any profitable cell (Buy, Sell, or Price) will immediately deploy the 7-tier arbitrage orders without any confirmation step.
