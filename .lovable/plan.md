

# Polymarket + BetAngel Hybrid Trading Ladder

## Design Philosophy Comparison

| Aspect | Current BetAngel | Polymarket Style | Hybrid Approach |
|--------|------------------|------------------|-----------------|
| **Color scheme** | Blue (Back) / Pink (Lay) | Green (Bid) / Red (Ask) | Keep BetAngel blue/pink with Polymarket's clean contrast |
| **Layout** | Separate YES/NO ladders | Single shared order book | Keep side-by-side but add shared book visualization |
| **Price display** | Decimal (0.48, 0.52) | Percentage with cents (48c, 52%) | Show both: "48c" with "48%" subtext |
| **Visual style** | Dense trading terminal | Clean, minimal, lots of whitespace | Clean cards with compact rows |
| **Spread indicator** | Implicit in ladder | Explicit "0.3c spread" callout | Add prominent spread pill |

---

## Visual Comparison

```text
CURRENT BETANGEL STYLE:
┌─────────────────────────────────────────┐
│         YES          │         NO       │
│  BACK │ PRICE │ LAY  │ BACK │ PRICE │ LAY │
│ ████  │ 0.52  │  42  │ ████ │ 0.48  │  38 │
└─────────────────────────────────────────┘

POLYMARKET + BETANGEL HYBRID:
┌─────────────────────────────────────────────────────────┐
│  ┌─────────────────┐    SPREAD: 2¢    ┌─────────────────┐│
│  │      YES        │                  │       NO        ││
│  │   52% chance    │                  │    48% chance   ││
│  └─────────────────┘                  └─────────────────┘│
├─────────────────────────────────────────────────────────┤
│    BUY     │   52¢   │ SELL  ║  BUY   │   48¢   │  SELL │
│  ▓▓▓  150  │   52%   │  42 ░ ║ ░  38  │   48%   │ 95 ▓▓▓│
│  ▓▓   120  │  ►51¢◄  │  65 ░░║ ░░ 52  │  ►49¢◄  │112 ▓▓▓│
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### 1. Add Polymarket Color Variables

**File:** `src/index.css`

Add Polymarket-inspired colors alongside BetAngel colors:

```css
/* Polymarket-inspired colors */
--poly-yes: 142 70% 45%;        /* Green for YES outcome */
--poly-no: 0 70% 55%;           /* Red for NO outcome */
--poly-bid: 142 60% 50%;        /* Green for bids */
--poly-ask: 0 60% 55%;          /* Red for asks */
--poly-spread: 45 90% 50%;      /* Yellow for spread highlight */
--poly-probability: 210 100% 60%; /* Blue for probability display */
```

### 2. Create Probability Header Component

**New File:** `src/components/trading/auto/ProbabilityHeader.tsx`

A Polymarket-style probability display above each ladder:

```tsx
interface ProbabilityHeaderProps {
  side: 'YES' | 'NO';
  probability: number;  // 0.52 → "52%"
  price: number;        // 0.52 → "52¢"
  change24h?: number;   // +2.3%
}

function ProbabilityHeader({ side, probability, price, change24h }: ProbabilityHeaderProps) {
  return (
    <div className={cn(
      "rounded-lg p-4 text-center",
      side === 'YES' 
        ? "bg-[hsl(var(--poly-yes))]/10 border border-[hsl(var(--poly-yes))]/30" 
        : "bg-[hsl(var(--poly-no))]/10 border border-[hsl(var(--poly-no))]/30"
    )}>
      <div className="text-2xl font-bold">
        {side === 'YES' ? '✓' : '✗'} {side}
      </div>
      <div className="text-3xl font-mono font-bold mt-1">
        {Math.round(probability * 100)}%
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        Buy at {Math.round(price * 100)}¢
      </div>
      {change24h && (
        <div className={cn(
          "text-xs mt-2 font-medium",
          change24h > 0 ? "text-success" : "text-destructive"
        )}>
          {change24h > 0 ? '↑' : '↓'} {Math.abs(change24h).toFixed(1)}% (24h)
        </div>
      )}
    </div>
  );
}
```

### 3. Add Spread Indicator Component

**New File:** `src/components/trading/auto/SpreadIndicator.tsx`

A prominent spread display between the two ladders:

```tsx
interface SpreadIndicatorProps {
  yesBestAsk: number;
  noBestAsk: number;
  spreadCents: number;
}

function SpreadIndicator({ yesBestAsk, noBestAsk, spreadCents }: SpreadIndicatorProps) {
  const totalCost = yesBestAsk + noBestAsk;
  const hasArb = totalCost < 1.0;
  
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className={cn(
        "px-4 py-2 rounded-full font-mono text-sm font-bold",
        hasArb 
          ? "bg-success/20 text-success border border-success/50"
          : "bg-muted text-muted-foreground"
      )}>
        {hasArb ? (
          <>Arb: {((1 - totalCost) * 100).toFixed(1)}%</>
        ) : (
          <>Spread: {spreadCents}¢</>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        YES {Math.round(yesBestAsk * 100)}¢ + NO {Math.round(noBestAsk * 100)}¢
      </div>
    </div>
  );
}
```

### 4. Update BetAngelLadder Header Styling

**File:** `src/components/trading/auto/BetAngelLadder.tsx`

Replace the simple header with Polymarket-style probability display:

```tsx
{/* Header - Polymarket style */}
<div className={cn(
  "p-4 text-center",
  side === 'YES' 
    ? "bg-gradient-to-b from-[hsl(var(--poly-yes))]/20 to-transparent" 
    : "bg-gradient-to-b from-[hsl(var(--poly-no))]/20 to-transparent"
)}>
  <div className={cn(
    "text-lg font-bold",
    side === 'YES' ? "text-[hsl(var(--poly-yes))]" : "text-[hsl(var(--poly-no))]"
  )}>
    {side}
  </div>
  <div className="text-2xl font-mono font-bold text-foreground">
    {Math.round(ltpPrice * 100)}¢
  </div>
  <div className="text-xs text-muted-foreground">
    {Math.round(ltpPrice * 100)}% chance
  </div>
</div>
```

### 5. Update Column Headers with Polymarket Language

**File:** `src/components/trading/auto/BetAngelLadder.tsx`

Change "BACK/LAY" to "BUY/SELL" for Polymarket familiarity:

```tsx
<div className="grid grid-cols-3 text-[10px] font-medium uppercase tracking-wider border-b border-border">
  <div className="py-1.5 px-2 text-center bg-[hsl(var(--betangel-back))]/30 text-muted-foreground">
    Buy
  </div>
  <div className="py-1.5 px-2 text-center bg-muted/30 text-muted-foreground">
    Price
  </div>
  <div className="py-1.5 px-2 text-center bg-[hsl(var(--betangel-lay))]/30 text-muted-foreground">
    Sell
  </div>
</div>
```

### 6. Update Price Display Format

**File:** `src/components/trading/auto/BetAngelPriceCell.tsx`

Show prices in cents (Polymarket style) with percentage subtext:

```tsx
function BetAngelPriceCell({ price, isLTP, momentum, isProfitable, onClick }: BetAngelPriceCellProps) {
  const cents = Math.round(price * 100);
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "h-8 flex flex-col items-center justify-center font-mono cursor-pointer",
        // ... existing styling
      )}
    >
      <div className="flex items-center text-sm font-bold">
        {isLTP && <span className="mr-0.5 text-[10px]">►</span>}
        {cents}¢
        {isLTP && <span className="ml-0.5 text-[10px]">◄</span>}
      </div>
      <div className="text-[9px] text-muted-foreground">
        {cents}%
      </div>
    </div>
  );
}
```

### 7. Update AutoLadder Layout

**File:** `src/components/trading/auto/AutoLadder.tsx`

Add the spread indicator between the two ladders:

```tsx
<div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-2 p-4">
  {/* YES Ladder */}
  <BetAngelLadder
    side="YES"
    // ... props
  />
  
  {/* Center Spread Indicator */}
  <div className="hidden md:flex">
    <SpreadIndicator
      yesBestAsk={orderBook?.refPrice ?? 0.5}
      noBestAsk={1 - (orderBook?.refPrice ?? 0.5)}
      spreadCents={2}
    />
  </div>
  
  {/* NO Ladder */}
  <BetAngelLadder
    side="NO"
    // ... props
  />
</div>
```

### 8. Add Quick Trade Buttons (Polymarket Style)

**New File:** `src/components/trading/auto/QuickTradeButtons.tsx`

Polymarket-style "Buy Yes" / "Buy No" buttons:

```tsx
interface QuickTradeButtonsProps {
  yesPrice: number;
  noPrice: number;
  stake: number;
  onBuyYes: () => void;
  onBuyNo: () => void;
}

function QuickTradeButtons({ yesPrice, noPrice, stake, onBuyYes, onBuyNo }: QuickTradeButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 border-t border-border">
      <Button 
        onClick={onBuyYes}
        className="h-12 bg-[hsl(var(--poly-yes))] hover:bg-[hsl(var(--poly-yes))]/90 text-white"
      >
        <div className="flex flex-col items-center">
          <span className="font-bold">Buy Yes</span>
          <span className="text-xs opacity-80">{Math.round(yesPrice * 100)}¢ → ${stake}</span>
        </div>
      </Button>
      <Button 
        onClick={onBuyNo}
        className="h-12 bg-[hsl(var(--poly-no))] hover:bg-[hsl(var(--poly-no))]/90 text-white"
      >
        <div className="flex flex-col items-center">
          <span className="font-bold">Buy No</span>
          <span className="text-xs opacity-80">{Math.round(noPrice * 100)}¢ → ${stake}</span>
        </div>
      </Button>
    </div>
  );
}
```

---

## Files to Modify/Create

| File | Action | Changes |
|------|--------|---------|
| `src/index.css` | Modify | Add Polymarket color variables |
| `src/components/trading/auto/SpreadIndicator.tsx` | Create | Spread display between ladders |
| `src/components/trading/auto/QuickTradeButtons.tsx` | Create | Buy Yes/Buy No action buttons |
| `src/components/trading/auto/BetAngelLadder.tsx` | Modify | Update header to show probability %, change BACK/LAY to BUY/SELL |
| `src/components/trading/auto/BetAngelPriceCell.tsx` | Modify | Show prices as cents (52¢) with % subtext |
| `src/components/trading/auto/AutoLadder.tsx` | Modify | Add SpreadIndicator, add QuickTradeButtons |

---

## Visual Result After Changes

```text
┌────────────────────────────────────────────────────────────────┐
│ BTC Order Book  [Pause] [⟳]    $50  $100  $250  $500  $1K      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐   ┌──────────┐   ┌─────────────────┐     │
│  │      YES        │   │ SPREAD   │   │       NO        │     │
│  │    52% chance   │   │   2¢     │   │   48% chance    │     │
│  │   Buy at 52¢    │   │ ────────│   │   Buy at 48¢    │     │
│  └─────────────────┘   │ Arb: 1%  │   └─────────────────┘     │
│                        └──────────┘                            │
│   BUY    │   52¢   │  SELL ║  BUY   │   48¢   │  SELL        │
│          │   52%   │       ║        │   48%   │              │
│ ▓▓▓ 150  │   52¢   │  42 ░ ║ ░  38  │   48¢   │  95 ▓▓▓     │
│ ▓▓  120  │  ►51¢◄  │  65 ░░║ ░░ 52  │  ►49¢◄  │ 112 ▓▓▓     │
│ ▓   89   │   50¢   │  89 ░░║ ░░░71  │   50¢   │  89 ▓▓      │
│          │   49¢   │ 112 ░░║ ░░░░95 │   51¢   │  65 ▓       │
│          │   48¢   │ 145 ░░║ ░░░128 │   52¢   │  42         │
├────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐   ┌─────────────────────┐            │
│  │     Buy Yes         │   │      Buy No         │            │
│  │   52¢ → $250        │   │    48¢ → $250       │            │
│  └─────────────────────┘   └─────────────────────┘            │
└────────────────────────────────────────────────────────────────┘
```

---

## Key Hybrid Elements

1. **BetAngel kept**: Blue/Pink depth bars, ladder structure, LTP indicators, tier labels
2. **Polymarket added**: Probability headers, cent pricing, spread indicator, Buy Yes/No buttons, cleaner card styling
3. **Best of both**: Professional trading depth visualization + intuitive prediction market UX

