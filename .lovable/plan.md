

# L1 = Market Order, L2-L7 = Limit Orders

## Change

In the tier table, L1 should be labeled as a **Market** order (executes at current price), while L2-L7 remain **Limit** orders at their calculated prices.

## File: `src/components/trading/ScaleOrderPreview.tsx`

**Add "Type" column to the table** showing "MKT" for L1 and "LMT" for L2-L7.

**Update L1 price display**: Show "MKT" or the market price with a "MKT" badge instead of a fixed cent price, since it executes at whatever the current price is.

**Table header**: Add a "Type" column between Tier and Price.

**Row rendering**:
- L1 (i === 0): Type = "MKT" badge (warning color), Price = market price or "Best"
- L2-L7 (i > 0): Type = "LMT" badge (muted), Price = calculated cent price as before

**Footer note**: Update to clarify "L1 executes at market · L2-L7 limit at 3¢ steps"

