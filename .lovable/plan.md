
# Fix Order Book Visibility with Sticky Orders Table

## Problem

The sticky orders table is now overlapping and covering the order book ladder. When `sticky bottom-0` is applied, the table hovers over the content below it without any reserved space, blocking the view of the trading ladder.

## Solution

Instead of making the orders table sticky, use a **fixed layout** where:
1. The page content (header + ladder) fills the available space above
2. The orders table is fixed at the bottom with a reserved height
3. Add padding to the main content area to prevent overlap

This ensures both the order book and orders table are always visible without overlap.

---

## Technical Changes

### File: `src/components/trading/auto/AutoLadder.tsx`

**1. Change the root container to use flex column with full height:**

Update the outer `div` (around line 466) to use a flex layout that fills the viewport:

```tsx
<div className="flex flex-col h-[calc(100vh-140px)]">
```

**2. Make the main content area scrollable:**

Wrap the main content (from the "Out of Range Warning" through the Card with ladders) in a scrollable container:

```tsx
<div className="flex-1 overflow-y-auto space-y-4 pb-4">
  {/* All existing content: warnings, header, card with ladders */}
</div>
```

**3. Change the orders table from sticky to fixed-at-bottom:**

Replace the sticky wrapper with a non-sticky container that stays at the bottom of the flex layout:

```tsx
{/* Limit Orders Table - Fixed at bottom */}
{deployedOrders.length > 0 && (
  <div className="flex-shrink-0 bg-background border-t border-border pt-4">
    <LimitOrdersTable
      orders={deployedOrders}
      onCancelAll={handleCancelAll}
      isCancelling={isCancelling}
    />
  </div>
)}
```

**4. Also show empty state when no orders (optional, for consistent layout):**

To keep the layout stable even when no orders exist, show the empty state at the bottom:

```tsx
{/* Limit Orders Table - Fixed at bottom */}
<div className="flex-shrink-0 bg-background border-t border-border pt-4">
  <LimitOrdersTable
    orders={deployedOrders}
    onCancelAll={handleCancelAll}
    isCancelling={isCancelling}
  />
</div>
```

---

## Visual Layout

```text
+------------------------------------------+
|          HEADER (fixed controls)         |
+------------------------------------------+
|                                          |
|         ORDER BOOK LADDER                |
|         (scrollable area)                |
|                                          |
|         - YES side | NO side             |
|         - Visible levels                 |
|                                          |
+------------------------------------------+
|         LIMIT ORDERS TABLE               |  <- Always at bottom
|         (non-scrollable, fixed height)   |
+------------------------------------------+
```

---

## Summary

| File | Change |
|------|--------|
| `src/components/trading/auto/AutoLadder.tsx` | Use flex column layout with scrollable content area and fixed-bottom orders table |

The order book will now be fully visible in a scrollable area, and the orders table will remain fixed at the bottom without overlapping the content.
