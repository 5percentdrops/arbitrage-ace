
# Fix Plan: Spread Calculator and Order Book Rows

## Issues Identified

### Issue 1: Only 3 rows showing in the order book
The `±3% range` filter is too restrictive. With `refPrice = 0.50`:
- `rangeMin = 0.50 * 0.97 = 0.485`
- `rangeMax = 0.50 * 1.03 = 0.515`

Only prices 0.49, 0.50, and 0.51 pass this filter, resulting in just 3 rows.

### Issue 2: Spread Calculator not appearing
The console shows a React warning about `forwardRef`. The component structure is correct, but the responsive grid layout (`lg:grid-cols-4`) may cause the right panel to collapse or not display properly on certain screen sizes.

---

## Solution

### 1. Increase the visible price range
Change `RANGE_PCT` from `0.03` (3%) to `0.15` (15%) in `useAutoOrderBook.ts` to show more levels:
- New range: 0.425 to 0.575 (approximately 15 rows)

### 2. Generate more mock order book levels
Update `generateMockOrderBook()` in `autoApi.ts` to create more levels (e.g., ±20 instead of ±10) for a richer display.

### 3. Fix the layout for Spread Calculator visibility
Update `AutoLadder.tsx` to ensure the right panel (containing SpreadCalculator and AutoOrdersPanel) is always visible:
- Change layout from `lg:grid-cols-4` to a more flexible approach
- Ensure the panel renders above or below the ladder on smaller screens

### 4. Add `forwardRef` wrapper to components (optional cleanup)
Wrap `SpreadCalculator` and `AutoOrdersPanel` with `React.forwardRef` to eliminate the console warning.

---

## Technical Details

### File: `src/hooks/useAutoOrderBook.ts`
```typescript
// Line 11: Change from 0.03 to 0.15
const RANGE_PCT = 0.15; // ±15% range around reference
```

### File: `src/services/autoApi.ts`
```typescript
// Line 56: Generate ±20 levels instead of ±10
for (let i = -20; i <= 20; i++) {
```

### File: `src/components/trading/auto/AutoLadder.tsx`
```typescript
// Line 154: Adjust grid layout for better visibility
<div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
  {/* Main Ladder - takes 3 columns on xl */}
  <Card className="xl:col-span-3 ...">

  {/* Right Side Panel - always visible */}
  <div className="xl:col-span-1 space-y-4">
```

Also reorder components so SpreadCalculator appears before the ladder on mobile.

### File: `src/components/trading/auto/SpreadCalculator.tsx`
```typescript
// Wrap with forwardRef to fix the console warning
import { forwardRef } from 'react';

export const SpreadCalculator = forwardRef<HTMLDivElement, SpreadCalculatorProps>(
  function SpreadCalculator(props, ref) {
    // ... existing implementation with ref applied to Card
  }
);
```

### File: `src/components/trading/auto/AutoOrdersPanel.tsx`
```typescript
// Same forwardRef treatment
import { forwardRef } from 'react';

export const AutoOrdersPanel = forwardRef<HTMLDivElement, AutoOrdersPanelProps>(
  function AutoOrdersPanel(props, ref) {
    // ... existing implementation
  }
);
```

---

## Expected Result

After these changes:
1. The order book ladder will display approximately 15+ price levels (instead of 3)
2. The Spread Calculator panel will be clearly visible on all screen sizes
3. Console warnings about refs will be eliminated
4. The layout will be responsive - panels stack on mobile, side-by-side on desktop
