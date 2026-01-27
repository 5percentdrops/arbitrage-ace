
# Default "Arb Only" Filter to ON

## Overview

Change the initial state of the "Arb Only" toggle so it defaults to enabled when the Order Ladder page loads. This ensures users immediately see only profitable arbitrage opportunities.

---

## Implementation

### File: `src/components/trading/auto/AutoLadder.tsx`

**Change line 41:**

```typescript
// Before
const [showProfitableOnly, setShowProfitableOnly] = useState(false);

// After  
const [showProfitableOnly, setShowProfitableOnly] = useState(true);
```

---

## Summary

| File | Change |
|------|--------|
| `src/components/trading/auto/AutoLadder.tsx` | Set `showProfitableOnly` initial state from `false` to `true` |

This is a single-character change that improves the default user experience by showing only actionable arbitrage opportunities on page load.
