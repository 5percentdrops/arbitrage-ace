
# Remove Order Ladder — Keep Manual Trading & Settings Only

## What Gets Removed

The Order Ladder (/auto-trading) route, page, sidebar link, and all associated files are stripped out entirely. The sidebar will only show **Manual Trading** and **Settings**.

---

## Files to Delete

These files exist solely for the Order Ladder page and have no use anywhere else:

- `src/pages/AutoTrading.tsx` — the Order Ladder page itself
- `src/components/trading/auto/AutoLadder.tsx`
- `src/components/trading/auto/AutoOrdersPanel.tsx`
- `src/components/trading/auto/BetAngelCell.tsx`
- `src/components/trading/auto/BetAngelLadder.tsx`
- `src/components/trading/auto/BetAngelPriceCell.tsx`
- `src/components/trading/auto/LadderRow.tsx`
- `src/components/trading/auto/LimitOrdersTable.tsx`
- `src/components/trading/auto/QuickStakeButtons.tsx`
- `src/components/trading/auto/SpreadCalculator.tsx`
- `src/components/trading/auto/SpreadIndicator.tsx`
- `src/hooks/useAutoOrderBook.ts`
- `src/services/autoApi.ts`
- `src/types/auto-trading.ts`

---

## Files to Modify

### `src/App.tsx`
- Remove `import AutoTrading from "./pages/AutoTrading"`
- Remove `<Route path="/auto-trading" element={<AutoTrading />} />`

### `src/components/layout/TradingSidebar.tsx`
- Remove `Layers` from the lucide-react import
- Remove the `{ title: 'Order Ladder', url: '/auto-trading', icon: Layers }` entry from `navItems`

---

## After the Change

The sidebar will have exactly two items:

```text
┌─────────────────────────┐
│ ⚡ Crypto Arb Bot        │
│   Polymarket Scanner    │
├─────────────────────────┤
│  Navigation             │
│  ↖  Manual Trading      │
│  ⚙  Settings            │
└─────────────────────────┘
```

Navigating directly to `/auto-trading` will fall through to the `NotFound` (404) page.

---

## Summary

| Action | Files |
|--------|-------|
| Delete | `src/pages/AutoTrading.tsx` + all 11 files in `src/components/trading/auto/` + `src/hooks/useAutoOrderBook.ts` + `src/services/autoApi.ts` + `src/types/auto-trading.ts` |
| Modify | `src/App.tsx` (remove route + import) |
| Modify | `src/components/layout/TradingSidebar.tsx` (remove nav item) |
