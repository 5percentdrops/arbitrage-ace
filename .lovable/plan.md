
# Fix Order Book Depth Slider Visibility

## Problem

The depth slider is not visible because it uses a native HTML `<input type="range">` element with `appearance-none`, which removes the browser's default styling. The custom CSS applied only styles the track background, leaving the slider thumb essentially invisible on the dark theme.

## Solution

Replace the native input with the project's existing Radix UI `Slider` component (`src/components/ui/slider.tsx`) which has proper styling for both the track and thumb, and works well with the dark theme.

---

## Implementation

### File: `src/components/trading/auto/AutoLadder.tsx`

**1. Add Slider import (around line 8):**

```typescript
import { Slider } from '@/components/ui/slider';
```

**2. Replace native input with Slider component (lines 662-670):**

Replace:
```tsx
<input
  type="range"
  min={5}
  max={30}
  step={5}
  value={orderBookRangePct}
  onChange={(e) => setOrderBookRangePct(Number(e.target.value))}
  className="w-20 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
/>
```

With:
```tsx
<Slider
  value={[orderBookRangePct]}
  onValueChange={(values) => setOrderBookRangePct(values[0])}
  min={5}
  max={30}
  step={5}
  className="w-24"
/>
```

---

## Summary

| File | Change |
|------|--------|
| `src/components/trading/auto/AutoLadder.tsx` | Import Slider component and replace native input with styled Radix UI Slider |

The Slider component has proper thumb and track styling that will be visible on both light and dark themes, matching the rest of the application's design.
