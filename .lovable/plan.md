
# Fix: Lock Scale Prices on Activation + Confirm Weight Logic

## Problem 1 — Prices Keep Changing
The `basePrice` passed to `ScaleOrderPreview` is computed inline on every render:

```ts
const basePrice = (() => {
  const parsed = parseFloat(formState.limitPrice);
  if (!isNaN(parsed) && parsed > 0) return parsed;
  if (marketSnapshot) {
    return formState.outcome === 'YES' ? marketSnapshot.yesAsk : marketSnapshot.noAsk;
  }
  return 0.50;
})();
```

Because `marketSnapshot` updates on every WebSocket tick, `basePrice` — and therefore the entire tier table — recalculates on every price update. Since these are all limit orders, the prices must be static once the user activates scale mode.

## Problem 2 — Weight Logic Clarity
The user confirmed the rule:
- **Scale In (Buy)**: As price goes down → more weight. L1 = cheapest entry = most weight (25%). Wait — actually re-reading: "as price reduces it gets heavier at the bottom", meaning the table shows prices going DOWN from top to bottom (L1 = base, L7 = cheapest) and weight increases toward the bottom. ✓ This matches current `scale-in` logic.
- **Scale Out (Sell)**: As price goes up → more weight. L1 = most expensive = most weight (25%). The table shows prices going UP from bottom to top, so L1 at the TOP is the highest price and gets the heaviest weight. ✓ This also matches current `scale-out` logic.

The logic is actually correct — the only real bug is the live price drift.

## Fix

### `src/components/trading/ManualTradePanel.tsx`

Replace the inline `basePrice` derivation with a **locked snapshot** using `useRef` or a separate state value. When the user activates scale mode (clicks Scale In or Scale Out), the current `basePrice` is captured and stored in state. It stays frozen until the user:
- Switches scale mode off and back on, OR
- Changes the `limitPrice` input manually

Specifically:
- Add `lockedBasePrice: number | null` state (default `null`)
- In `toggleScaleMode`, when activating a mode, immediately snapshot the current `basePrice` into `lockedBasePrice`
- When deactivating (OFF), reset `lockedBasePrice` to `null`
- Pass `lockedBasePrice ?? basePrice` to `ScaleOrderPreview`
- Additionally: watch `formState.limitPrice` — if the user types a new limit price while scale mode is active, update `lockedBasePrice` to the newly typed value (since the user is explicitly choosing a new base)

This way:
- Live WebSocket ticks do NOT move the table
- If the user manually types a limit price, the table updates to reflect their explicit choice
- Toggling scale mode re-snaps to the latest price

### Change Summary

| File | Change |
|------|--------|
| `src/components/trading/ManualTradePanel.tsx` | Add `lockedBasePrice` state; capture on scale mode activation; pass locked value to `ScaleOrderPreview` |

No changes needed to `ScaleOrderPreview.tsx` — the weight logic is already correct.

## Before / After

```text
BEFORE:
  User activates Scale In at 52¢
  WebSocket update → price moves to 53¢
  Table recalculates: L1=53¢, L2=50¢, L3=47¢... (all shift)

AFTER:
  User activates Scale In at 52¢
  basePrice locked at 52¢
  WebSocket update → price moves to 53¢
  Table stays: L1=52¢, L2=49¢, L3=46¢... (frozen)
  
  User types 55 in Limit Price field
  lockedBasePrice updates to 55¢
  Table updates: L1=55¢, L2=52¢, L3=49¢...
```
