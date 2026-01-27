
# Order Book 3% Price Range Filter

## Summary

Change the order book view to only display price levels within ±3% of the current YES and NO reference prices. This creates a focused, fast-paced view showing only the most relevant price levels for trading.

---

## Current vs New Behavior

```text
CURRENT (±15% range):
  YES @ 50¢ → Shows levels from 35¢ to 65¢ (30¢ window)
  
NEW (±3% range):
  YES @ 50¢ → Shows levels from 47¢ to 53¢ (6¢ window)
```

---

## Implementation Plan

### 1. Update Range Constant

**File:** `src/hooks/useAutoOrderBook.ts`

Change the range percentage from 15% to 3%:

```typescript
// Line 12: Change from 0.15 to 0.03
const RANGE_PCT = 0.03; // ±3% range around reference
```

### 2. Update Out-of-Range Warning Text

**File:** `src/components/trading/auto/AutoLadder.tsx`

Update the warning message to reflect the new range:

```typescript
// Line 320: Update text
<span>Price moved outside ±3% range. Consider cancelling orders.</span>
```

### 3. Update Range Display in Header

**File:** `src/components/trading/auto/AutoLadder.tsx`

The range display already shows `rangeMin` and `rangeMax` (line 437), so it will automatically update to show the tighter range (e.g., "0.47 - 0.53" instead of "0.35 - 0.65").

---

## Visual Result

```text
BEFORE (±15% range - 30 rows):
┌──────────────────────────────────────┐
│  Range: 0.35 - 0.65                  │
│  ▓▓  65¢  │  ...                     │
│  ▓▓  64¢  │  ...                     │
│  ...many rows...                     │
│  ▓▓  36¢  │  ...                     │
│  ▓▓  35¢  │  ...                     │
└──────────────────────────────────────┘

AFTER (±3% range - 6 rows):
┌──────────────────────────────────────┐
│  Range: 0.47 - 0.53                  │
│  ▓▓  53¢  │  ...                     │
│  ▓▓  52¢  │  ...                     │
│  ▓▓  51¢  │  ...  ← Focused view     │
│  ▓▓  50¢  │  ...                     │
│  ▓▓  49¢  │  ...                     │
│  ▓▓  48¢  │  ...                     │
│  ▓▓  47¢  │  ...                     │
└──────────────────────────────────────┘
```

---

## Files to Modify

| File | Line | Change |
|------|------|--------|
| `src/hooks/useAutoOrderBook.ts` | 12 | Change `RANGE_PCT = 0.15` to `0.03` |
| `src/components/trading/auto/AutoLadder.tsx` | 320 | Update warning text from "±15%" to "±3%" |

---

## Technical Notes

- The ±3% range at 50¢ gives a 6¢ window (47¢-53¢)
- This creates a compact, fast-scrolling view ideal for quick order placement
- The range automatically adjusts as the reference price moves
- Out-of-range warning triggers when best ask prices exceed the ±3% bounds
