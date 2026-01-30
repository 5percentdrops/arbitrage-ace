import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { BetAngelCell } from './BetAngelCell';
import { BetAngelPriceCell, type PriceMomentum } from './BetAngelPriceCell';
import type { OrderBookLevel, ActiveLadderOrder, LevelEdgeInfo } from '@/types/auto-trading';

interface DragPreview {
  orderId: string;
  targetLevelPrice: number;
  arbPct: number;
}

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
  // Drag-and-drop props
  dragPreview?: DragPreview | null;
  onDragStart?: (orderId: string, side: 'YES' | 'NO', type: 'back' | 'lay') => void;
  onDragEnd?: () => void;
  onDragOver?: (orderId: string, side: 'YES' | 'NO', type: 'back' | 'lay', levelPrice: number, targetSide: 'YES' | 'NO', targetType: 'back' | 'lay') => void;
  onOrderDrop?: (orderId: string, levelPrice: number, side: 'YES' | 'NO', type: 'back' | 'lay') => void;
  autoTradeEnabled?: boolean;
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
  dragPreview,
  onDragStart,
  onDragEnd,
  onDragOver,
  onOrderDrop,
  autoTradeEnabled = false,
}: BetAngelLadderProps) {
  // Track active drag state locally
  const [activeDrag, setActiveDrag] = useState<{
    orderId: string;
    side: 'YES' | 'NO';
    type: 'back' | 'lay';
  } | null>(null);

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

  // Handler for drag start from a cell
  const handleCellDragStart = (orderId: string, orderSide: 'YES' | 'NO', orderType: 'back' | 'lay') => {
    setActiveDrag({ orderId, side: orderSide, type: orderType });
    onDragStart?.(orderId, orderSide, orderType);
  };

  // Handler for drag end
  const handleCellDragEnd = () => {
    setActiveDrag(null);
    onDragEnd?.();
  };

  // Handler for drag over a cell
  const handleCellDragOver = (levelPrice: number, targetType: 'back' | 'lay') => {
    if (!activeDrag) return;
    // Only allow if same side and same column type
    if (activeDrag.side !== side || activeDrag.type !== targetType) return;
    onDragOver?.(activeDrag.orderId, activeDrag.side, activeDrag.type, levelPrice, side, targetType);
  };

  // Handler for drop on a cell
  const handleCellDrop = (levelPrice: number, targetType: 'back' | 'lay') => {
    if (!activeDrag) return;
    // Validate: same side AND same column
    if (activeDrag.side !== side || activeDrag.type !== targetType) return;
    onOrderDrop?.(activeDrag.orderId, levelPrice, side, targetType);
    setActiveDrag(null);
  };

  // Check if drag is disabled
  const isDragDisabled = autoTradeEnabled;

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
          const levelEdge = levelEdges.get(level.price);
          const isLTP = ltpPrice !== undefined && Math.abs(price - ltpPrice) < 0.005;
          
          // Check for orders at this price level
          const ordersAtPrice = sideOrders.filter(o => o.levelPrice !== undefined && Math.abs(o.levelPrice - level.price) < 0.005);
          const backOrder = ordersAtPrice.find(o => o.orderType === 'back');
          const layOrder = ordersAtPrice.find(o => o.orderType === 'lay');
          const hasBackOrder = !!backOrder;
          const hasLayOrder = !!layOrder;
          const backOrderLabel = backOrder?.ladderIndex ? `L${backOrder.ladderIndex}` : undefined;
          const layOrderLabel = layOrder?.ladderIndex ? `L${layOrder.ladderIndex}` : undefined;
          
          // Preview state
          const previewData = previewPrices.get(level.price);
          const isInPreview = !!previewData;
          
          // Drop target state - check if this level is the current drag target
          const isBackDropTarget = activeDrag && 
            activeDrag.side === side && 
            activeDrag.type === 'back' && 
            dragPreview?.targetLevelPrice === level.price;
          const isLayDropTarget = activeDrag && 
            activeDrag.side === side && 
            activeDrag.type === 'lay' && 
            dragPreview?.targetLevelPrice === level.price;
          
          return (
            <div 
              key={level.price}
              className={cn(
                "grid grid-cols-3 border-b border-border/30 transition-all relative cursor-pointer",
                isProfitable && "bg-success/5 hover:bg-success/15",
                isInPreview && "ring-2 ring-inset ring-primary/60 bg-primary/10"
              )}
              onClick={() => isProfitable && onPriceClick(level.price)}
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
                levelPrice={level.price}
                onClick={(e) => { e.stopPropagation(); onBackClick(level.price); }}
                hasOrder={hasBackOrder}
                orderLabel={backOrderLabel}
                orderId={backOrder?.id}
                orderSide={side}
                onDragStart={handleCellDragStart}
                onDragEnd={handleCellDragEnd}
                onDragOver={(lp) => handleCellDragOver(lp, 'back')}
                onDragLeave={handleCellDragEnd}
                onDrop={(lp) => handleCellDrop(lp, 'back')}
                isDropTarget={isBackDropTarget}
                dropPreviewArbPct={isBackDropTarget ? dragPreview?.arbPct : undefined}
                isDragDisabled={isDragDisabled}
              />
              <BetAngelPriceCell
                price={price}
                isLTP={isLTP}
                momentum={momentum}
                isProfitable={isProfitable}
                edgePct={isProfitable ? levelEdge?.netEdgePct : undefined}
                onClick={() => onPriceClick(level.price)}
              />
              <BetAngelCell
                value={askValue}
                maxDepth={maxDepth}
                type="lay"
                levelPrice={level.price}
                onClick={(e) => { e.stopPropagation(); onLayClick(level.price); }}
                hasOrder={hasLayOrder}
                orderLabel={layOrderLabel}
                orderId={layOrder?.id}
                orderSide={side}
                onDragStart={handleCellDragStart}
                onDragEnd={handleCellDragEnd}
                onDragOver={(lp) => handleCellDragOver(lp, 'lay')}
                onDragLeave={handleCellDragEnd}
                onDrop={(lp) => handleCellDrop(lp, 'lay')}
                isDropTarget={isLayDropTarget}
                dropPreviewArbPct={isLayDropTarget ? dragPreview?.arbPct : undefined}
                isDragDisabled={isDragDisabled}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
