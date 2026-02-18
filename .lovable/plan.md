
# Split UP and DOWN into Two Separate Blocks

## Problem
Currently the UP and DOWN prices are rendered inside a single container (`grid grid-cols-2` with one shared `bg-secondary/50 border border-border` background). The user wants them as two visually distinct, independent blocks side by side.

## Fix

**File: `src/components/trading/ManualTradePanel.tsx`** — lines 152–185

Replace the single shared container with two individual cards side-by-side:

```text
Before (one joined block):
┌────────────────────────────────────────┐
│              BTC                       │
│    ✓ UP          DOWN ✗               │
│    52¢           51¢                  │
│   52% chance    51% chance            │
└────────────────────────────────────────┘

After (two separate blocks):
┌──────────────────┐  ┌──────────────────┐
│     ✓ UP         │  │     DOWN ✗        │
│      52¢         │  │      51¢          │
│    52% chance    │  │    51% chance     │
└──────────────────┘  └──────────────────┘
```

Each block gets its own border, background, and rounded corners. The ticker name (BTC) moves to sit above both blocks, centered.

## Technical Change

Replace the single `<div className="grid grid-cols-2 gap-6 p-4 rounded-lg bg-secondary/50 border border-border">` wrapper with a layout that wraps the ticker name and then two independent cards:

```tsx
{marketSnapshot && (
  <div className="space-y-2">
    {/* Ticker above both blocks */}
    <div className="text-center">
      <span className="text-lg font-bold text-primary">{formState.asset}</span>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {/* UP block */}
      <div className="flex flex-col items-center space-y-1 p-4 rounded-lg bg-secondary/50 border border-success/20">
        ...
      </div>
      {/* DOWN block */}
      <div className="flex flex-col items-center space-y-1 p-4 rounded-lg bg-secondary/50 border border-destructive/20">
        ...
      </div>
    </div>
  </div>
)}
```

Each block gets a subtle colored border matching its direction (green tint for UP, red tint for DOWN) to make them feel distinct.

## Files Changed

| File | Change |
|------|--------|
| `src/components/trading/ManualTradePanel.tsx` | Split single joint container into two independent styled blocks |
