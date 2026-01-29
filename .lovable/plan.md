
## What’s happening (why you see no prices)
Right now `visibleLevels` requires **the same row** to satisfy both:
- `YES ask < current YES chance (refPrice)`
- `NO ask < current NO chance (1 - refPrice)`

But in the simulated order book, most rows won’t have **both legs** priced below their respective current market chances at the same time (that’s an extremely strict constraint), so the filter can easily return **0 rows**, especially with “Arb Only” also ON.

You also asked for: if 0 rows match → **auto-loosen** instead of showing empty.

## Goal
Keep your intended strict rule (“both sides must be below the chance %”), but ensure the ladder never goes blank by adding a **tiered fallback** (auto-loosen).

## Implementation plan

### 1) Update filtering to use a tiered fallback (AutoLadder.tsx)
**File:** `src/components/trading/auto/AutoLadder.tsx`  
**Area:** `visibleLevels` `useMemo` (around current lines ~212–238)

We’ll compute thresholds:
- `yesChance = orderBook.refPrice`
- `noChance = 1 - orderBook.refPrice`
- keep your depth window (lower bounds) as-is:
  - `yesLowerBound = yesChance * (1 - orderBookRangePct / 100)`
  - `noLowerBound = noChance * (1 - orderBookRangePct / 100)`

Then filter in **three passes**:

**Pass A (strict):** must be in depth AND both sides strictly below chance
- `yesLowerBound <= yesAskPrice < yesChance`
- `noLowerBound <= noAskPrice < noChance`

If **Pass A** returns at least 1 level → use it.

**Pass B (auto-loosen #1):** must be in depth AND at least one side strictly below chance
- `(yesLowerBound <= yesAskPrice < yesChance) OR (noLowerBound <= noAskPrice < noChance)`

If **Pass B** returns at least 1 level → use it.

**Pass C (auto-loosen #2):** show a sane “depth window” even if no asks are below chance (prevents blank ladder)
- Use depth based on the row reference price instead of asks:
  - keep rows whose `level.price` is within the configured depth around `refPrice`
  - example logic: `level.price` between `refPrice * (1 - rangePct)` and `refPrice * (1 + rangePct)`
  - (or alternatively: show the nearest N rows to refPrice)

This ensures the order book never goes fully empty.

### 2) Keep “Arb Only” behavior consistent with fallback
Currently we apply `showProfitableOnly` after the range checks. With fallback logic, we need to decide how “Arb Only” interacts:

- In **Pass A / B**, keep the `showProfitableOnly` check the same.
- In **Pass C**, if `showProfitableOnly` is ON and we still get 0 rows, we’ll auto-loosen one more time by temporarily ignoring `showProfitableOnly` (otherwise Pass C could still be empty).

Result: “Arb Only” stays meaningful, but won’t cause a blank ladder when the market has no profitable rows.

### 3) Add a small UI indicator when auto-loosen is active
So users understand why they’re seeing rows that don’t meet the strict rule.

**File:** `src/components/trading/auto/AutoLadder.tsx`  
**Location:** near the ladder header controls (where the slider/toggles are)

Add a derived label/badge such as:
- “Filter: Strict”
- “Filter: Loosened (either side)”
- “Filter: Loosened (depth only)”

This is important so the behavior is transparent.

### 4) Quick sanity checks to run after implementation
1. With default settings (depth 10%, Arb Only ON), the ladder should not be blank.
2. If strict rows exist, the indicator should show “Strict”.
3. If strict rows don’t exist, it should auto-switch to loosened mode and show the badge.
4. Confirm “strictly less than” is still enforced whenever we’re in strict/relaxed modes (no equal-to chance prices).

## Notes (why this is the correct fix for your requirement)
- Your “both sides must be below current chance” rule is valid, but it can be rare in real data and especially in this simulation.
- Auto-loosen is the right UX to avoid an empty ladder while still prioritizing strict opportunities when they exist.
