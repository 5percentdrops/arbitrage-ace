

# Move UP/DOWN Prices into Manual Trading Panel

## Overview
Integrate the UP/DOWN price display directly into the ManualTradePanel component, removing the need for a separate MarketSnapshotCard.

## Visual Design

```text
┌─────────────────────────────────────────────────┐
│ ↕️ Manual Trading              [Live] [Auto ⚪] │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  ✓ UP              DOWN ✗               │   │
│  │                                         │   │
│  │   48¢               52¢                 │   │
│  │  48% chance       52% chance            │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Signal                                         │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Crowd Prob % │  │ Time (sec)   │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
│  ... rest of form ...                          │
└─────────────────────────────────────────────────┘
```

## Implementation

### File: `src/components/trading/ManualTradePanel.tsx`

**Changes:**

1. Add `MarketSnapshot` type import
2. Add `marketSnapshot` prop to the component interface
3. Add UP/DOWN price display section at the top of CardContent (before bot warning)
4. Display prices in Polymarket style: icon + label, large cent price, percentage

### File: `src/pages/Index.tsx`

**Changes:**

1. Remove MarketSnapshotCard import and usage
2. Pass `marketSnapshot` prop to ManualTradePanel via TradingTabs

### File: `src/components/trading/TradingTabs.tsx`

**Changes:**

1. Add `marketSnapshot` prop and pass it to ManualTradePanel

## Technical Details

| Component | Change |
|-----------|--------|
| ManualTradePanel | Add `marketSnapshot` prop, render UP/DOWN prices at top |
| TradingTabs | Pass through `marketSnapshot` prop |
| Index.tsx | Remove MarketSnapshotCard, pass snapshot to TradingTabs |

### New Props for ManualTradePanel

```typescript
interface ManualTradePanelProps {
  // ... existing props ...
  marketSnapshot?: MarketSnapshot | null;
}
```

### Price Display Section (added to ManualTradePanel)

```tsx
{/* UP/DOWN Prices - Polymarket Style */}
{marketSnapshot && (
  <div className="grid grid-cols-2 gap-6 p-4 rounded-lg bg-secondary/50 border border-border">
    {/* UP */}
    <div className="flex flex-col items-center space-y-1">
      <div className="flex items-center gap-1.5">
        <Check className="h-4 w-4 text-success" />
        <span className="text-sm font-bold text-success">UP</span>
      </div>
      <div className="text-3xl font-mono font-bold">
        {Math.round(marketSnapshot.yesAsk * 100)}¢
      </div>
      <div className="text-xs text-muted-foreground">
        {Math.round(marketSnapshot.yesAsk * 100)}% chance
      </div>
    </div>
    {/* DOWN */}
    <div className="flex flex-col items-center space-y-1">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold text-destructive">DOWN</span>
        <X className="h-4 w-4 text-destructive" />
      </div>
      <div className="text-3xl font-mono font-bold">
        {Math.round(marketSnapshot.noAsk * 100)}¢
      </div>
      <div className="text-xs text-muted-foreground">
        {Math.round(marketSnapshot.noAsk * 100)}% chance
      </div>
    </div>
  </div>
)}
```

## Files Changed

| File | Changes |
|------|---------|
| `src/components/trading/ManualTradePanel.tsx` | Add marketSnapshot prop, render UP/DOWN prices at top |
| `src/components/trading/TradingTabs.tsx` | Pass marketSnapshot to ManualTradePanel |
| `src/pages/Index.tsx` | Remove MarketSnapshotCard, pass marketSnapshot via TradingTabs |

