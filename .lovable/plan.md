
# Make Limit Orders Table Static

## Problem

The Limit Orders Table below the order book ladder shifts up and down as the order book range changes because it's rendered in normal document flow after the dynamically-sized order book card.

## Solution

Make the Limit Orders Table sticky at the bottom of the viewport so it remains static regardless of how the order book content changes. This provides a fixed reference point for viewing active orders while scrolling through the order book.

---

## Technical Implementation

### File: `src/components/trading/auto/AutoLadder.tsx`

**Change the bottom Limit Orders Table wrapper to use sticky positioning:**

Replace the current simple rendering (lines 750-755):
```tsx
{/* Limit Orders Table Below Ladder */}
<LimitOrdersTable
  orders={deployedOrders}
  onCancelAll={handleCancelAll}
  isCancelling={isCancelling}
/>
```

With a sticky container:
```tsx
{/* Limit Orders Table - Sticky at bottom */}
{deployedOrders.length > 0 && (
  <div className="sticky bottom-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border pt-4">
    <LimitOrdersTable
      orders={deployedOrders}
      onCancelAll={handleCancelAll}
      isCancelling={isCancelling}
    />
  </div>
)}
```

**Key changes:**
- `sticky bottom-0`: Pins the table to the bottom of viewport when scrolling
- `z-30`: Ensures table stays above other content
- `bg-background/95 backdrop-blur-sm`: Semi-transparent background with blur for visual separation
- `border-t border-border`: Adds a top border to visually separate from content above
- Conditional rendering: Only show when there are orders (cleaner UX when no orders)

---

## Summary

| File | Change |
|------|--------|
| `src/components/trading/auto/AutoLadder.tsx` | Wrap bottom LimitOrdersTable in sticky container with `sticky bottom-0` positioning |

The orders table will now stay fixed at the bottom of the viewport, providing a stable view of active orders regardless of order book depth or range changes.
