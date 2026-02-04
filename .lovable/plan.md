
# Add Ticker Name to UP/DOWN Price Display

## Overview
Add the selected asset ticker name (BTC, ETH, SOL, XRP) to the UP/DOWN price display section, so users can see which market they're viewing prices for.

## Visual Design

```text
Current:                           New:
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  ✓ UP           DOWN ✗      │    │           BTC               │
│                             │    │  ✓ UP           DOWN ✗      │
│   48¢            52¢        │    │                             │
│  48% chance    52% chance   │    │   48¢            52¢        │
└─────────────────────────────┘    │  48% chance    52% chance   │
                                   └─────────────────────────────┘
```

## Implementation

### File: `src/components/trading/ManualTradePanel.tsx`

**Change:** Add ticker name header above the UP/DOWN columns

Add a centered ticker name at the top of the price display section using `formState.asset`:

```tsx
{marketSnapshot && (
  <div className="grid grid-cols-2 gap-6 p-4 rounded-lg bg-secondary/50 border border-border">
    {/* Ticker Name - spans both columns */}
    <div className="col-span-2 text-center mb-2">
      <span className="text-lg font-bold text-primary">{formState.asset}</span>
    </div>
    {/* UP column */}
    ...
    {/* DOWN column */}
    ...
  </div>
)}
```

## Files Changed

| File | Changes |
|------|---------|
| `src/components/trading/ManualTradePanel.tsx` | Add `formState.asset` ticker name header above UP/DOWN prices |

## Result
- Ticker name displays prominently above the UP/DOWN prices
- Automatically updates when user selects a different asset in the Asset toggle group
- No additional props needed since `formState.asset` is already available
