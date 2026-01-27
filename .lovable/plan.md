

# BetAngel-Style Trading Ladder Redesign

## Current vs BetAngel Style Comparison

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  CURRENT LAYOUT                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  YES Bid │ YES Price │ YES Ask │  Spread/Edge  │ NO Bid │ NO Price │ NO Ask │
│   150    │   0.48    │   200   │ 0.99 +1.2%    │  180   │   0.51   │   220  │
│   120    │   0.49    │   180   │ 0.98 +0.8%    │  150   │   0.50   │   190  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  BETANGEL STYLE                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│              YES LADDER              │             NO LADDER                │
│  Back   │  PRICE  │   Lay            │   Back   │  PRICE  │   Lay          │
│ (Blue)  │         │  (Pink)          │  (Blue)  │         │  (Pink)        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ████   │  0.52   │   42             │   ████   │  0.48   │   38           │
│  ████   │  0.51   │   65             │   ████   │  0.49   │   52           │
│  ████   │ ►0.50◄  │   89             │   ████   │ ►0.50◄  │   71           │  ← LTP (yellow)
│  ████   │  0.49   │  112             │   ████   │  0.51   │   95           │
│  ████   │  0.48   │  145             │   ████   │  0.52   │  128           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Blue/Pink depth bars | Centered on LTP | Auto-scroll option                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key BetAngel Features to Implement

### 1. Color Scheme Overhaul
| Element | Current | BetAngel Style |
|---------|---------|----------------|
| Back/Buy cells | Green tints | **Blue** (`#6BBBFC` or similar) |
| Lay/Sell cells | Green/Red tints | **Pink** (`#F9A8C8` or similar) |
| Price column | Green/Red text | **White/Yellow on dark** |
| LTP indicator | Border only | **Yellow highlight + arrow** |
| Depth bars | None | **Gradient fill proportional to volume** |

### 2. Layout Changes
- **Separate YES and NO ladders** side-by-side (instead of interleaved)
- **Vertical price column** in the center of each ladder
- **Depth visualization bars** behind bid/ask values
- **Compact row height** (more rows visible)
- **Auto-center toggle** to keep LTP in the middle

### 3. Visual Enhancements
- **Depth gradient bars**: Show volume as colored bars behind numbers
- **LTP momentum colors**: Green (up), Red (down), Yellow (same)
- **P/L projection column**: Show potential profit at each price level
- **Quick stake buttons**: Row of preset amounts at the top

### 4. Interaction Improvements
- **One-click trading**: Click Back/Lay cell to place order immediately
- **Drag-and-drop orders**: Move pending orders to different prices
- **Hover P/L preview**: Show projected P/L when hovering any row

---

## Implementation Plan

### Phase 1: New Color Variables (index.css)

Add BetAngel-specific trading colors:

```css
/* BetAngel Trading Colors */
--betangel-back: 207 90% 70%;      /* Blue for Back/Buy */
--betangel-lay: 340 80% 80%;       /* Pink for Lay/Sell */
--betangel-ltp-up: 142 70% 45%;    /* Green - price rising */
--betangel-ltp-down: 0 70% 55%;    /* Red - price falling */
--betangel-ltp-same: 45 95% 55%;   /* Yellow - no change */
--betangel-depth-back: 207 90% 70%;
--betangel-depth-lay: 340 80% 80%;
```

### Phase 2: New LadderCell Component

Create a BetAngel-style cell with depth bars:

```tsx
interface BetAngelCellProps {
  value: number;           // Volume/size
  maxDepth: number;        // Max volume for scaling
  type: 'back' | 'lay';    // Blue or Pink
  onClick?: () => void;
  hasOrder?: boolean;
}

function BetAngelCell({ value, maxDepth, type, onClick, hasOrder }: BetAngelCellProps) {
  const depthPercent = Math.min((value / maxDepth) * 100, 100);
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative h-7 flex items-center justify-center cursor-pointer",
        "font-mono text-xs font-semibold",
        type === 'back' ? "text-blue-900" : "text-pink-900"
      )}
    >
      {/* Depth bar background */}
      <div 
        className={cn(
          "absolute inset-y-0 right-0",
          type === 'back' 
            ? "bg-[hsl(var(--betangel-back))]" 
            : "bg-[hsl(var(--betangel-lay))]"
        )}
        style={{ width: `${depthPercent}%` }}
      />
      {/* Value text */}
      <span className="relative z-10">{value}</span>
    </div>
  );
}
```

### Phase 3: New BetAngelLadder Layout

Restructure to show two separate vertical ladders:

```tsx
<div className="grid grid-cols-2 gap-4">
  {/* YES Ladder */}
  <div className="flex flex-col">
    <div className="text-center font-bold text-success mb-2">YES</div>
    <div className="grid grid-cols-3 text-[10px] border-b">
      <span className="text-center bg-[hsl(var(--betangel-back))]/30">BACK</span>
      <span className="text-center">PRICE</span>
      <span className="text-center bg-[hsl(var(--betangel-lay))]/30">LAY</span>
    </div>
    {levels.map(level => (
      <div key={level.price} className="grid grid-cols-3 h-7 border-b border-border/30">
        <BetAngelCell value={level.yesBid} type="back" maxDepth={maxYesDepth} />
        <PriceCell price={level.yesAskPrice} isLTP={isLTP} momentum={momentum} />
        <BetAngelCell value={level.yesAsk} type="lay" maxDepth={maxYesDepth} />
      </div>
    ))}
  </div>

  {/* NO Ladder */}
  <div className="flex flex-col">
    <div className="text-center font-bold text-destructive mb-2">NO</div>
    {/* Mirror layout */}
  </div>
</div>
```

### Phase 4: LTP (Last Traded Price) Indicator

Add momentum-colored price highlighting:

```tsx
function PriceCell({ price, isLTP, momentum }: PriceCellProps) {
  return (
    <div className={cn(
      "h-7 flex items-center justify-center font-mono text-xs font-bold",
      isLTP && momentum === 'up' && "bg-[hsl(var(--betangel-ltp-up))]/30 text-success",
      isLTP && momentum === 'down' && "bg-[hsl(var(--betangel-ltp-down))]/30 text-destructive",
      isLTP && momentum === 'same' && "bg-[hsl(var(--betangel-ltp-same))]/30 text-yellow-500"
    )}>
      {isLTP && <span className="mr-1">►</span>}
      {price.toFixed(2)}
      {isLTP && <span className="ml-1">◄</span>}
    </div>
  );
}
```

### Phase 5: Quick Stake Buttons

Add preset amount buttons at the top:

```tsx
<div className="flex items-center gap-2 p-2 border-b">
  {[50, 100, 250, 500, 1000].map(stake => (
    <Button 
      key={stake}
      variant="outline" 
      size="sm"
      onClick={() => setPositionSize(stake)}
      className={cn(
        "h-7 px-3 font-mono text-xs",
        positionSize === stake && "bg-primary text-primary-foreground"
      )}
    >
      ${stake}
    </Button>
  ))}
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add BetAngel color variables |
| `src/components/trading/auto/LadderRow.tsx` | Complete rewrite to BetAngel cell style with depth bars |
| `src/components/trading/auto/AutoLadder.tsx` | Restructure to side-by-side YES/NO ladders, add quick stakes, add LTP tracking |
| `src/hooks/useAutoOrderBook.ts` | Add LTP momentum tracking (up/down/same) |

---

## Visual Preview After Changes

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ BTC Order Book                    [Pause] [⟳]     $50  $100  $250  $500  $1K │
│ Tick: 0.01 | Range: 0.40-0.60                              ☑ Arb Only        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│           ═══════ YES ═══════          │         ═══════ NO ═══════          │
│    BACK     │  PRICE  │    LAY         │    BACK    │  PRICE  │    LAY       │
│ ▓▓▓▓▓  150  │  0.52   │  42   ░        │ ░░░░   38  │  0.48   │  95  ▓▓▓▓    │
│ ▓▓▓▓   120  │  0.51   │  65   ░░       │ ░░     52  │  0.49   │ 112  ▓▓▓▓▓   │
│ ▓▓▓    89   │ ►0.50◄  │  89   ░░░      │ ░░░    71  │ ►0.50◄  │  89  ▓▓▓     │  ← LTP (yellow)
│ ▓▓     65   │  0.49   │ 112   ░░░░     │ ░░░░   95  │  0.51   │  65  ▓▓      │
│ ▓      42   │  0.48   │ 145   ░░░░░    │ ░░░░░ 128  │  0.52   │  42  ▓       │
├──────────────────────────────────────────────────────────────────────────────┤
│  ▓ = Blue (Back depth)    ░ = Pink (Lay depth)    ►◄ = Last Trade Price     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Considerations

1. **Performance**: Depth bars use CSS percentage widths (no JS animation)
2. **Responsiveness**: Side-by-side ladders stack on mobile
3. **Accessibility**: Maintain keyboard navigation and ARIA labels
4. **Theme compatibility**: Colors work in both light and dark modes

