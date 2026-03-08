

# Auto-Fill L1 Price from Last Market Price

## What Changes

When scale-in or scale-out is activated, the L1 price input auto-fills with the current market price from the WebSocket snapshot — so the user doesn't have to type it manually.

## File Changes

### `src/components/trading/ScaleOrderPreview.tsx`
- Add optional `marketPriceCents` prop (number | null)
- Add `useEffect`: when `marketPriceCents` changes and is valid, auto-set `l1Price` to that value
- This only fires when the market price updates; the user can still override manually

### `src/components/trading/ManualTradePanel.tsx`
- Compute the relevant market price in cents based on `formState.outcome` and `marketSnapshot`
  - YES outcome → `Math.round(marketSnapshot.yesAsk * 100)`
  - NO outcome → `Math.round(marketSnapshot.noAsk * 100)`
- Pass `marketPriceCents` to `ScaleOrderPreview`

## Behavior

- When user toggles Scale In or Scale Out, L1 price is pre-filled from the live market price
- If WebSocket updates, L1 price updates automatically (user can still edit manually)
- If no market data available, L1 stays empty as before

