
# Fix Uneven Ladder Columns

## Problem

The grid layout still uses a 3-column template: `grid-cols-[1fr,auto,1fr]`

After removing the middle SpreadIndicator, only 2 items remain but the layout still expects 3, causing the NO ladder to squeeze into the middle `auto` column instead of taking equal space.

## Solution

**File: `src/components/trading/auto/AutoLadder.tsx`**

Change line 689 from:
```tsx
<div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-2 p-4">
```

To:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
```

This gives both YES and NO ladders equal width (50% each on medium+ screens).

## Files to Modify

| File | Change |
|------|--------|
| `src/components/trading/auto/AutoLadder.tsx` | Change grid from 3-column to 2-column layout (line 689) |
