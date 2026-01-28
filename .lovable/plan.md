

# Add Signal Section to Manual Trading Panel

## Overview

Add a "Signal" section to the Manual Trading panel that displays two key pieces of information:
1. **Crowd Probability** - The percentage showing which way the crowd is leaning (from decision alerts data)
2. **Remaining Time** - Time left in the current 15-minute round

This section will appear near the top of the ManualTradePanel, giving traders quick context from the contrarian signal system.

## Data Flow

The data already exists in the app:
- **Crowd probability**: Available from `decisionAlerts` (specifically `majority_side` and `majority_pct` fields)
- **Remaining time**: Available from `roundTimer.secondsRemaining`

We need to pass this data through the component hierarchy:
```
Index.tsx → TradingTabs.tsx → ManualTradePanel.tsx
```

## Changes

### 1. Update TradingTabs Props (src/components/trading/TradingTabs.tsx)

Add two new props to pass signal data:

```tsx
interface TradingTabsProps {
  // ... existing props ...
  
  // Signal section data
  crowdSide?: 'UP' | 'DOWN';
  crowdPct?: number;
  secondsRemaining: number;
}
```

### 2. Update ManualTradePanel Props (src/components/trading/ManualTradePanel.tsx)

Add the same props and render a new Signal section:

```tsx
interface ManualTradePanelProps {
  // ... existing props ...
  
  // Signal data
  crowdSide?: 'UP' | 'DOWN';
  crowdPct?: number;
  secondsRemaining: number;
}
```

Add a new Signal section after the header, styled as a compact info bar:

```tsx
{/* Signal Section */}
<div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Crowd:</span>
      {crowdSide && crowdPct ? (
        <span className={cn(
          "font-mono font-semibold",
          crowdSide === 'UP' ? 'text-success' : 'text-destructive'
        )}>
          {crowdSide} {crowdPct}%
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">--</span>
      )}
    </div>
  </div>
  
  <div className="flex items-center gap-2">
    <Clock className="h-4 w-4 text-muted-foreground" />
    <span className="text-xs text-muted-foreground">Time:</span>
    <span className={cn(
      "font-mono font-semibold",
      secondsRemaining <= 300 && "text-destructive"
    )}>
      {formatTime(secondsRemaining)}
    </span>
  </div>
</div>
```

### 3. Update Index.tsx to Pass Signal Data

Extract the most relevant alert's crowd data (matching selected asset) and pass it along with the round timer:

```tsx
// Find matching alert for selected asset
const matchingAlert = decisionAlerts.find(
  a => a.asset === manualTrading.formState.asset
);

<TradingTabs
  // ... existing props ...
  crowdSide={matchingAlert?.majority_side}
  crowdPct={matchingAlert?.majority_pct}
  secondsRemaining={roundTimer.secondsRemaining}
/>
```

## Visual Design

The Signal section will appear as a horizontal info bar:

```text
┌─────────────────────────────────────────────────────────┐
│ 👥 Crowd: UP 67%                        ⏱ Time: 08:42  │
└─────────────────────────────────────────────────────────┘
```

- Uses muted icons and labels with prominent data values
- Crowd side color-coded (green for UP, red for DOWN)
- Time turns red when under 5 minutes (entry blocked threshold)

## Files to Modify

| File | Change |
|------|--------|
| `src/components/trading/ManualTradePanel.tsx` | Add crowdSide, crowdPct, secondsRemaining props; render Signal section |
| `src/components/trading/TradingTabs.tsx` | Add and forward new props |
| `src/pages/Index.tsx` | Extract matching alert data and pass to TradingTabs |

