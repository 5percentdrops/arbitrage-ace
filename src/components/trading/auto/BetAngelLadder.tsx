import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BetAngelCell } from './BetAngelCell';
import { BetAngelPriceCell, type PriceMomentum } from './BetAngelPriceCell';
import type { OrderBookLevel, ActiveLadderOrder, LevelEdgeInfo } from '@/types/auto-trading';

interface BetAngelLadderProps {
  side: 'YES' | 'NO';
  levels: OrderBookLevel[];
  levelEdges: Map<number, LevelEdgeInfo>;
  profitableLevels: Set<number>;
  deployedOrders: ActiveLadderOrder[];
  ltpPrice?: number;
  momentum?: PriceMomentum;
  previewPrices: Map<number, { tier: number; allocation: number }>;
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

  return (
    <div className="flex flex-col border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className={cn(
        "text-center font-bold py-2 text-sm",
        side === 'YES' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
      )}>
        {side}
      </div>
      
      {/* Column headers */}
      <div className="grid grid-cols-3 text-[10px] font-medium uppercase tracking-wider border-b border-border">
        <div className="py-1.5 px-2 text-center bg-[hsl(var(--betangel-back))]/30 text-muted-foreground">
          Back
        </div>
        <div className="py-1.5 px-2 text-center bg-muted/30 text-muted-foreground">
          Price
        </div>
        <div className="py-1.5 px-2 text-center bg-[hsl(var(--betangel-lay))]/30 text-muted-foreground">
          Lay
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
          const ordersAtPrice = sideOrders.filter(o => Math.abs(o.price - price) < 0.005);
          const hasBackOrder = ordersAtPrice.some(o => o.price <= price);
          const hasLayOrder = ordersAtPrice.some(o => o.price >= price);
          const orderLabel = ordersAtPrice[0]?.ladderIndex ? `L${ordersAtPrice[0].ladderIndex}` : undefined;
          
          // Preview state
          const previewData = previewPrices.get(level.price);
          const isInPreview = !!previewData;
          
          return (
            <div 
              key={level.price}
              className={cn(
                "grid grid-cols-3 border-b border-border/30 transition-all",
                isProfitable && "bg-success/5",
                isInPreview && "ring-2 ring-inset ring-primary/60 bg-primary/10"
              )}
            >
              {/* Tier label overlay */}
              {isInPreview && previewData && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-r font-bold">
                  L{previewData.tier}: ${previewData.allocation}
                </div>
              )}
              
              <BetAngelCell
                value={bidValue}
                maxDepth={maxDepth}
                type="back"
                onClick={() => onBackClick(level.price)}
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
                onClick={() => onLayClick(level.price)}
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
