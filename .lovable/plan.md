
# Fix: L1 Price Set Manually by User — Other Tiers Auto-Calculate

## What Changes

The `basePrice` prop (and all the `lockedBasePrice` complexity in `ManualTradePanel`) is replaced by a simple L1 price input field **inside** `ScaleOrderPreview`. The user types L1's price directly, and L2–L7 are derived automatically from it.

---

## Logic

### Scale In (Buy Dips) — price decreases from L1 downward
```
L1 = user input (e.g. 52¢)  → lightest weight (8%)
L2 = 52 - 3 = 49¢           → 10%
L3 = 52 - 6 = 46¢           → 11%
L4 = 52 - 9 = 43¢           → 13%
L5 = 52 - 12 = 40¢          → 15%
L6 = 52 - 15 = 37¢          → 18%
L7 = 52 - 18 = 34¢          → heaviest (25%)
```

### Scale Out (Sell Rallies) — price increases from L1 upward
```
L1 = user input (e.g. 52¢)  → lightest weight (8%)
L2 = 52 + 3 = 55¢           → 10%
L3 = 52 + 6 = 58¢           → 11%
L4 = 52 + 9 = 61¢           → 13%
L5 = 52 + 12 = 64¢          → 15%
L6 = 52 + 15 = 67¢          → 18%
L7 = 52 + 18 = 70¢          → heaviest (25%)
```

Both modes: **L1 is always the lightest (8%), L7 is always the heaviest (25%).** Price steps away from L1 by 3¢ per tier.

---

## File Changes

### `src/components/trading/ScaleOrderPreview.tsx`

- **Remove** `basePrice` prop
- **Add** internal `l1Price` state (string, starts empty)
- **Add** an "L1 Price" input field at the top of the component (above Total Stake), accepting values in cents (e.g. `52`)
- **Compute tiers** from `l1PriceCents`:
  - Scale In: `priceCents = l1PriceCents - offsetCents`, weight = `TIER_WEIGHTS[6 - i]` (8% at top, 25% at bottom)
  - Scale Out: `priceCents = l1PriceCents + offsetCents`, weight = `TIER_WEIGHTS[6 - i]` (same — 8% at L1, 25% at L7)
- **Show placeholder table** with dashes when L1 price is not yet entered
- **Remove** the "Base price: Xc" footer note (replaced by the input itself)

### `src/components/trading/ManualTradePanel.tsx`

- **Remove** `lockedBasePrice` state
- **Remove** `handleLimitPriceChange` (revert limit price input back to simple `onFieldChange`)
- **Remove** `effectiveBasePrice` derivation
- **Remove** `basePrice` prop from `<ScaleOrderPreview>` usage
- Keep `scaleMode`, `scaleStake`, `toggleScaleMode` as-is

---

## UI Layout of ScaleOrderPreview After Fix

```text
┌─────────────────────────────────────────────────────┐
│ ↓ Scale In Preview — Buy Dips                       │
│                                                     │
│ L1 Price (¢)                                        │
│ [___52_______________________]                      │
│                                                     │
│ Total Stake                                         │
│ [$10][$25][$50][$100][$250][$500][$1K] [Custom___]  │
│                                                     │
│ Tier  Price   Weight   USD                          │
│  L1   52¢      8%     $8.00   ▲ lightest            │
│  L2   49¢     10%    $10.00                         │
│  L3   46¢     11%    $11.00                         │
│  L4   43¢     13%    $13.00                         │
│  L5   40¢     15%    $15.00                         │
│  L6   37¢     18%    $18.00                         │
│  L7   34¢     25%    $25.00   ▼ heaviest            │
│                                                     │
│ Total: $100.00 · Steps: 3¢ per tier                 │
└─────────────────────────────────────────────────────┘
```

---

## Summary

| File | Change |
|------|--------|
| `src/components/trading/ScaleOrderPreview.tsx` | Remove `basePrice` prop; add internal L1 price input; fix weight mapping so L1=8% and L7=25% for both modes; fix Scale Out to use ascending prices |
| `src/components/trading/ManualTradePanel.tsx` | Remove `lockedBasePrice`, `handleLimitPriceChange`, `effectiveBasePrice`; remove `basePrice` prop from `<ScaleOrderPreview>` |
