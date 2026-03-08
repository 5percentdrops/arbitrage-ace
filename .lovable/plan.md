

# Fix: L1 Price Should Not Auto-Update After Being Set

## Problem
The `useEffect` on line 25-29 overwrites the L1 price every time `marketPriceCents` changes. Once the user enters a value (or it's auto-filled on first load), it should stay locked.

## Solution

### `src/components/trading/ScaleOrderPreview.tsx`
- Add a `useRef` flag (`hasBeenSet`) initialized to `false`
- In the `useEffect`, only set `l1Price` if `hasBeenSet` is still `false`, then flip it to `true`
- When the user manually types in the L1 input, also set `hasBeenSet` to `true`
- Reset `hasBeenSet` to `false` when the component unmounts/remounts (i.e., when scale mode is toggled off then on again — this happens naturally since the component unmounts)

This ensures the L1 price is filled exactly once (either from market data or manual entry) and never overwritten afterward.

