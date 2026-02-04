

# Simplify Market Snapshot: UP/DOWN Prices (Polymarket Style)

## Overview
Replace the detailed bid/ask grid with a clean, simple display showing just the latest UP and DOWN prices in the Polymarket visual style.

## Visual Design

```text
Current (Complex):                 New (Simple Polymarket Style):
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  YES          NO            │    │   Market Snapshot (BTC)   ⟳ │
│ ┌─────────┐ ┌─────────┐    │    │                             │
│ │Bid 0.48 │ │Bid 0.52 │    │    │  ✓ UP           DOWN ✗      │
│ │Ask 0.49 │ │Ask 0.53 │    │    │                             │
│ └─────────┘ └─────────┘    │    │   48¢            52¢        │
│                             │    │  48% chance    52% chance   │
│ Combined: 1.02 (2% spread)  │    │                             │
└─────────────────────────────┘    └─────────────────────────────┘
```

## Implementation

### File: `src/components/trading/MarketSnapshotCard.tsx`

**Changes:**

1. Add `Check` and `X` icons from lucide-react
2. Replace YES/NO labels with "✓ UP" and "DOWN ✗"
3. Remove bid/ask detail rows
4. Show single large price in cents (e.g., "48¢")
5. Add percentage chance below each price
6. Remove the combined stats footer (keep it simple)

**New structure:**
- Two columns side by side
- Each column shows: icon + label, large cent price, percentage chance
- Green for UP, red for DOWN

## Technical Details

| Element | Current | New |
|---------|---------|-----|
| Labels | "YES" / "NO" | "✓ UP" / "DOWN ✗" |
| Price format | 0.480 (decimal) | 48¢ (cents) |
| Data shown | Bid + Ask | Ask price only |
| Footer | Combined + spread | Removed |

## File Changed

| File | Changes |
|------|---------|
| `src/components/trading/MarketSnapshotCard.tsx` | Simplify to show only UP/DOWN prices with icons, matching Polymarket style |

