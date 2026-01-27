
# Restore Pause Button Visibility + Add Cancel (X) Button for Selections

## Issues Identified

### 1. Pause Button May Be Hidden
The Pause button exists in the code but may not be visible due to:
- The header has many controls (Position Size input, Arb Only toggle, Pause, Refresh) that may overflow on smaller screens
- The `flex items-center gap-4` layout may cause wrapping or overflow issues

### 2. No Cancel Button for Selections
When rows are selected/previewed (showing tier labels like "L1: $250"), there's no quick way to cancel/clear the selection. The user wants an (X) button to dismiss the preview.

---

## Implementation Plan

### 1. Fix Header Layout for Pause Button Visibility

**File:** `src/components/trading/auto/AutoLadder.tsx`

Reorganize the header controls to ensure Pause button is always visible:
- Move Pause and Refresh buttons to a prominent position
- Use `flex-wrap` to handle smaller screens gracefully
- Consider grouping related controls together

```tsx
<CardHeader className="pb-2 flex-row flex-wrap items-center justify-between gap-2">
  <div className="flex items-center gap-3">
    <CardTitle>...</CardTitle>
    {/* Pause/Refresh buttons immediately after title for visibility */}
    <div className="flex items-center gap-1">
      <Button variant={isPaused ? "default" : "ghost"} size="sm" ...>
        {isPaused ? <><Play /> Resume</> : <><Pause /> Pause</>}
      </Button>
      <Button variant="ghost" size="icon" ...>
        <RefreshCw />
      </Button>
    </div>
  </div>
  <div className="flex items-center gap-3 flex-wrap">
    {/* Position Size, Arb Only toggle */}
  </div>
</CardHeader>
```

### 2. Add Cancel (X) Button When Rows Are Previewed

**File:** `src/components/trading/auto/AutoLadder.tsx`

Add a floating cancel button that appears when `previewPrices.size > 0` (rows are highlighted):

```tsx
{previewPrices.size > 0 && (
  <div className="absolute top-2 right-2 z-20">
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setPreviewPrices(new Map())}
      className="h-6 w-6 bg-background/80 hover:bg-destructive/20"
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
)}
```

### 3. Add Cancel Button When Orders Are Deployed

Show a prominent "Cancel All" button when `deployedOrders.length > 0`:

```tsx
{deployedOrders.length > 0 && (
  <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 border-b border-warning/30">
    <span className="text-xs text-warning font-medium">
      {deployedOrders.length} orders deployed
    </span>
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCancelAll}
      disabled={isCancelling}
      className="h-6 gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      <X className="h-3.5 w-3.5" />
      Cancel All
    </Button>
  </div>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/trading/auto/AutoLadder.tsx` | Reorganize header layout, add X icon import, add cancel buttons for preview and deployed orders |

---

## Visual Layout After Changes

```text
+-------------------------------------------------------------------------+
| BTC Order Book Ladder [Pause] [⟳]    | Position Size: $___  ☑ Arb Only |
| Tick: 0.01 | Range: 0.40-0.60                                           |
+-------------------------------------------------------------------------+
| [!] 14 orders deployed                                    [X Cancel All]|
+-------------------------------------------------------------------------+
| Best Arbitrage Found: YES @ 0.48 + NO @ 0.51 = +1.2%    [Quick Deploy] |
+-------------------------------------------------------------------------+
|                          [ Header Row ]                                 |
|  L1: $250  | 0.48 | ... +2.1% ... |  click [X]  | 0.52 |                |
|  L2: $180  | 0.49 | ... +1.8% ...               | 0.51 |                |
+-------------------------------------------------------------------------+
```

---

## Technical Details

### New Import
Add `X` icon from lucide-react:
```typescript
import { AlertTriangle, RefreshCw, Zap, TrendingUp, Filter, Pause, Play, DollarSign, X } from 'lucide-react';
```

### Clear Preview Function
The preview is already using a Map, so clearing is simple:
```typescript
setPreviewPrices(new Map());
```

### Cancel All Behavior
The existing `handleCancelAll` function already:
- Clears `deployedOrders`
- Calls `clearSelections()`
- Shows loading state with `isCancelling`
