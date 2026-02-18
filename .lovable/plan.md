
# Confirmed Scope — Two Features for the Manual Trading Section

## Clarification
The scale in/out feature will be placed inside `ManualTradePanel.tsx` (the card on the main dashboard page), **not** the `AutoLadder` on the Auto Trading page. The timer feature updates `RoundTimerCard` and `useRoundTimer`.

---

## Feature 1 — 5-Minute Timer Mode

### What changes
`useRoundTimer.ts` is currently hardcoded to 15-minute UTC-aligned boundaries. The `calculateRoundBoundaries` function uses `/15` and `+ 15` everywhere.

The fix is straightforward:
- Add `roundDuration: 5 | 15` state (default `15`) to the hook
- Pass `durationMinutes` into `calculateRoundBoundaries` so it uses `/5` or `/15`
- Return `roundDuration` and `setRoundDuration` from the hook
- Update the red-alert threshold: 5 min remaining for 15m rounds → 1 min for 5m rounds
- Add a pill toggle `[5m] [15m]` to `RoundTimerCard` header, next to the asset selector

### Files changed
| File | Change |
|------|--------|
| `src/hooks/useRoundTimer.ts` | Add `roundDuration` state + update boundary calc |
| `src/components/trading/RoundTimerCard.tsx` | Add `5m / 15m` pill toggle, accept new props |
| `src/pages/Index.tsx` | Pass `roundTimer.roundDuration` and `roundTimer.setRoundDuration` to `RoundTimerCard` |

---

## Feature 2 — Scale In / Scale Out in the Manual Trading Panel

### Where it goes
Below the **Order Type** toggle (LIMIT / MARKET) and above the **Shares / Notional** input in `ManualTradePanel.tsx`. It only appears when `orderType === 'LIMIT'` since scale orders are limit orders by definition.

### UX Flow

```text
Order Type: [LIMIT] [MARKET]

Scale Orders: [OFF] [Scale In ▼] [Scale Out ▲]   ← new toggle row

(when Scale In or Scale Out is selected)
┌─────────────────────────────────────────────────────┐
│ Total Stake                                         │
│ [$10] [$25] [$50] [$100] [$250] [$500] [$1000] [___]│
├──────┬──────────┬────────┬─────────────────────────┤
│ Tier │ Price    │ Weight │ USD                      │
├──────┼──────────┼────────┼─────────────────────────┤
│  L1  │  52¢     │  25%   │ $250  ← best / heaviest │
│  L2  │  49¢     │  18%   │ $180                    │
│  L3  │  46¢     │  15%   │ $150                    │
│  L4  │  43¢     │  13%   │ $130                    │
│  L5  │  40¢     │  11%   │ $110                    │
│  L6  │  37¢     │  10%   │ $100                    │
│  L7  │  34¢     │   8%   │  $80  ← cheapest/lightest│
└──────┴──────────┴────────┴─────────────────────────┘
```

### Price Step Logic
- **Base price**: the current limit price the user has typed in the Limit Price field (or live `yesAsk`/`noAsk` from the market snapshot as a smart default)
- **Scale In (BUY dips)**: 7 prices spread downward from base — `base, base−3¢, base−6¢, base−9¢, base−12¢, base−15¢, base−18¢`
  - L1 (best/most expensive ask) gets the **largest** allocation (25%) — you get more shares cheaper as you go down
- **Scale Out (SELL rallies)**: 7 prices spread upward from base — `base, base+3¢, base+6¢, base+9¢, base+12¢, base+15¢, base+18¢`
  - L1 (lowest sell price) gets **smallest** allocation (8%) — saves more size for higher prices

### Tier Weights (reused from AutoLadder)
```
[25%, 18%, 15%, 13%, 11%, 10%, 8%]
```

### Stake Presets
`$10`, `$25`, `$50`, `$100`, `$250`, `$500`, `$1000` + custom free-text input.
These are independent of the main notional/shares field above.

### New Component: `src/components/trading/ScaleOrderPreview.tsx`
A self-contained component with props:
- `mode: 'scale-in' | 'scale-out'`
- `basePrice: number` (in cents, e.g. 52)
- `totalStake: number`
- `onStakeChange: (v: number) => void`

Internally computes the 7-row table. No external state needed beyond `basePrice` and `totalStake`.

### Changes to `ManualTradePanel.tsx`
- Add local state: `scaleMode: 'none' | 'scale-in' | 'scale-out'` and `scaleStake: number` (default 100)
- Add a 3-button row after Order Type selection
- When `scaleMode !== 'none'` and `orderType === 'LIMIT'`, render `<ScaleOrderPreview>`
- Base price auto-derived from `formState.limitPrice` if filled, otherwise falls back to live `marketSnapshot.yesAsk` or `noAsk` based on direction

### Files changed
| File | Action |
|------|--------|
| `src/components/trading/ScaleOrderPreview.tsx` | Create — scale preview table |
| `src/components/trading/ManualTradePanel.tsx` | Add scale mode toggle + render preview |

---

## Summary of All Changes

| File | Action |
|------|--------|
| `src/hooks/useRoundTimer.ts` | Add `roundDuration` state |
| `src/components/trading/RoundTimerCard.tsx` | Add `5m / 15m` toggle |
| `src/pages/Index.tsx` | Pass new timer props |
| `src/components/trading/ScaleOrderPreview.tsx` | New — scale preview table |
| `src/components/trading/ManualTradePanel.tsx` | Add scale mode UI |
