import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BetAngelCell } from './BetAngelCell';
import { BetAngelPriceCell, type PriceMomentum } from './BetAngelPriceCell';
import type { OrderBookLevel, ActiveLadderOrder, LevelEdgeInfo, PairedArbSelection } from '@/types/auto-trading';

interface BetAngelLadderProps {
  side: 'YES' | 'NO';
  levels: OrderBookLevel[];
  levelEdges: Map<number, LevelEdgeInfo>;
  profitableLevels: Set<number>;
  deployedOrders: ActiveLadderOrder[];
  ltpPrice?: number;
  momentum?: PriceMomentum;
  previewPrices: Map<number, { tier: number; allocation: number }>;
  pairedSelection?: PairedArbSelection | null;
  onBackClick: (price: number) => void;
  onLayClick: (price: number) => void;
  onPriceClick: (price: number) => void;
}

export function BetAngelLadder({
  side,
  levels,
  levelEdges,
  profitableLevels,
  deployedOrders,
  ltpPrice,
  momentum = 'same',
  previewPrices,
  pairedSelection,
  onBackClick,
  onLayClick,
  onPriceClick,
}: BetAngelLadderProps) {
  // Calculate max depth for scaling bars
  const maxDepth = useMemo(() => {
    let max = 0;
    levels.forEach(level => {
      if (side === 'YES') {
        max = Math.max(max, level.yesBid, level.yesAsk);
      } else {
        max = Math.max(max, level.noBid, level.noAsk);
      }
    });
    return max;
  }, [levels, side]);

  // Get orders for this side
  const sideOrders = deployedOrders.filter(o => o.side === side);

  // Calculate probability display
  const probability = ltpPrice ? Math.round(ltpPrice * 100) : 50;

  return (
    <div className="flex flex-col border border-border rounded-lg overflow-hidden">
      {/* Header - Polymarket style probability */}
      <div className={cn(
        "p-4 text-center",
        side === 'YES' 
          ? "bg-gradient-to-b from-[hsl(var(--poly-yes))]/20 to-transparent" 
          : "bg-gradient-to-b from-[hsl(var(--poly-no))]/20 to-transparent"
      )}>
        <div className={cn(
          "text-lg font-bold",
          side === 'YES' ? "text-[hsl(var(--poly-yes))]" : "text-[hsl(var(--poly-no))]"
        )}>
          {side === 'YES' ? '✓' : '✗'} {side}
        </div>
        <div className="text-2xl font-mono font-bold text-foreground">
          {probability}¢
        </div>
        <div className="text-xs text-muted-foreground">
          {probability}% chance
        </div>
      </div>
      
      {/* Column headers - Polymarket language */}
      <div className="grid grid-cols-3 text-[10px] font-medium uppercase tracking-wider border-b border-border">
        <div className="py-1.5 px-2 text-center bg-[hsl(var(--betangel-back))]/30 text-muted-foreground">
          Buy
        </div>
        <div className="py-1.5 px-2 text-center bg-muted/30 text-muted-foreground">
          Price
        </div>
        <div className="py-1.5 px-2 text-center bg-[hsl(var(--betangel-lay))]/30 text-muted-foreground">
          Sell
        </div>
      </div>
      
      {/* Rows */}
      <div className="max-h-[400px] overflow-y-auto">
        {levels.map((level) => {
          const price = side === 'YES' ? level.yesAskPrice : level.noAskPrice;
          const bidValue = side === 'YES' ? level.yesBid : level.noBid;
          const askValue = side === 'YES' ? level.yesAsk : level.noAsk;
          const isProfitable = profitableLevels.has(level.price);
          const isLTP = ltpPrice !== undefined && Math.abs(price - ltpPrice) < 0.005;
          
          // Check for orders at this price
          const ordersAtPrice = sideOrders.filter(o => o.levelPrice !== undefined && Math.abs(o.levelPrice - level.price) < 0.005);
          const hasBackOrder = ordersAtPrice.some(o => o.price <= price);
          const hasLayOrder = ordersAtPrice.some(o => o.price >= price);
          const orderLabel = ordersAtPrice[0]?.ladderIndex ? `L${ordersAtPrice[0].ladderIndex}` : undefined;
          
          // Preview state
          const previewData = previewPrices.get(level.price);
          const isInPreview = !!previewData;
          
          // Paired selection state - highlight this row if it's part of the pair
          const isPairedLevel = pairedSelection && level.price === pairedSelection.levelPrice;
          const showPairedHighlight = isPairedLevel;
          
          return (
            <div 
              key={level.price}
              className={cn(
                "grid grid-cols-3 border-b border-border/30 transition-all relative cursor-pointer",
                isProfitable && !showPairedHighlight && "bg-success/5 hover:bg-success/15",
                isInPreview && !showPairedHighlight && "ring-2 ring-inset ring-primary/60 bg-primary/10",
                showPairedHighlight && "ring-2 ring-inset ring-success bg-success/20"
              )}
              onClick={() => isProfitable && onPriceClick(level.price)}
            >
              {/* Paired selection indicator */}
              {showPairedHighlight && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-[9px] bg-success text-success-foreground px-1.5 py-0.5 rounded-r font-bold">
                  ${side === 'YES' ? pairedSelection.yesAllocation : pairedSelection.noAllocation}
                </div>
              )}
              
              {/* Tier label overlay (for non-paired preview) */}
              {isInPreview && previewData && !showPairedHighlight && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-r font-bold">
                  L{previewData.tier}: ${previewData.allocation}
                </div>
              )}
              
              <BetAngelCell
                value={bidValue}
                maxDepth={maxDepth}
                type="back"
                onClick={(e) => { e.stopPropagation(); onBackClick(level.price); }}
                hasOrder={hasBackOrder}
                orderLabel={hasBackOrder ? orderLabel : undefined}
              />
              <BetAngelPriceCell
                price={price}
                isLTP={isLTP}
                momentum={momentum}
                isProfitable={isProfitable}
                onClick={() => onPriceClick(level.price)}
              />
              <BetAngelCell
                value={askValue}
                maxDepth={maxDepth}
                type="lay"
                onClick={(e) => { e.stopPropagation(); onLayClick(level.price); }}
                hasOrder={hasLayOrder}
                orderLabel={hasLayOrder ? orderLabel : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
