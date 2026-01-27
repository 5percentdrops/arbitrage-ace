import { cn } from '@/lib/utils';
import type { OrderBookLevel, ActiveLadderOrder, LevelEdgeInfo } from '@/types/auto-trading';

interface LadderRowProps {
  level: OrderBookLevel;
  edgeInfo: LevelEdgeInfo | null;
  isSelected: boolean;
  isProfitable: boolean;
  isSuggested: boolean;
  isMidpoint: boolean;
  yesOrders: ActiveLadderOrder[];
  noOrders: ActiveLadderOrder[];
  onYesClick: (type: 'bid' | 'ask') => void;
  onNoClick: (type: 'bid' | 'ask') => void;
  onArbClick?: () => void;
  onHover?: (isHovering: boolean) => void;
  isInPreview?: boolean;
  previewTier?: number;
  tierAllocation?: number;
}

export function LadderRow({
  level,
  edgeInfo,
  isSelected,
  isProfitable,
  isSuggested,
  isMidpoint,
  yesOrders,
  noOrders,
  onYesClick,
  onNoClick,
  onArbClick,
  onHover,
  isInPreview,
  previewTier,
  tierAllocation,
}: LadderRowProps) {
  // Use actual ask prices for display
  const yesPrice = level.yesAskPrice;
  const noPrice = level.noAskPrice;

  return (
    <div
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={cn(
        "grid grid-cols-9 text-xs font-mono border-b border-border/50 transition-all duration-150 relative",
        isSelected && "bg-primary/20 border-primary/50",
        isProfitable && !isSelected && "bg-success/10",
        isSuggested && "ring-1 ring-dashed ring-warning",
        isMidpoint && "border-b-2 border-b-primary",
        isInPreview && "ring-2 ring-inset ring-primary/60 bg-primary/10"
      )}
    >
      {/* Tier Label Overlay */}
      {isInPreview && previewTier && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-r font-bold">
          L{previewTier}: ${tierAllocation}
        </div>
      )}

      {/* YES Side */}
      <Cell
        value={level.yesBid}
        type="bid"
        side="YES"
        onClick={() => onYesClick('bid')}
        orders={yesOrders.filter(o => o.price === yesPrice)}
      />
      <Cell
        value={yesPrice}
        isPrice
        className="text-success font-bold"
      />
      <Cell
        value={level.yesAsk}
        type="ask"
        side="YES"
        isProfitable={isProfitable}
        onClick={() => onYesClick('ask')}
        orders={[]}
      />

      {/* Middle Column - Spread/Edge Info */}
      <div 
        onClick={isProfitable && onArbClick ? onArbClick : undefined}
        className={cn(
          "col-span-3 flex items-center justify-center gap-2 bg-muted/20 px-2 transition-colors",
          isProfitable && onArbClick && "cursor-pointer hover:bg-success/20 hover:ring-1 hover:ring-success/50"
        )}
      >
        {edgeInfo && (
          <>
            <span className={cn(
              "text-[10px] font-mono",
              edgeInfo.isProfitable ? "text-success" : "text-muted-foreground"
            )}>
              {edgeInfo.totalCost.toFixed(3)}
            </span>
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded",
              edgeInfo.isProfitable 
                ? "bg-success/20 text-success" 
                : "text-muted-foreground"
            )}>
              {edgeInfo.netEdgePct >= 0 ? '+' : ''}{edgeInfo.netEdgePct.toFixed(2)}%
            </span>
            {isProfitable && onArbClick && (
              <span className="text-[9px] text-success/70 ml-1">click to deploy</span>
            )}
          </>
        )}
      </div>

      {/* NO Side */}
      <Cell
        value={level.noBid}
        type="bid"
        side="NO"
        onClick={() => onNoClick('bid')}
        orders={noOrders.filter(o => o.price === noPrice)}
      />
      <Cell
        value={noPrice}
        isPrice
        className="text-destructive font-bold"
      />
      <Cell
        value={level.noAsk}
        type="ask"
        side="NO"
        isProfitable={isProfitable}
        onClick={() => onNoClick('ask')}
        orders={[]}
      />
    </div>
  );
}

interface CellProps {
  value: number;
  type?: 'bid' | 'ask';
  side?: 'YES' | 'NO';
  isPrice?: boolean;
  isProfitable?: boolean;
  className?: string;
  onClick?: () => void;
  orders?: ActiveLadderOrder[];
}

function Cell({ value, type, side, isPrice, isProfitable, className, onClick, orders = [] }: CellProps) {
  const hasOrders = orders.length > 0;
  
  if (isPrice) {
    return (
      <div className={cn(
        "py-1.5 px-2 text-center tabular-nums",
        className
      )}>
        {value.toFixed(2)}
      </div>
    );
  }

  const isBid = type === 'bid';
  const isAsk = type === 'ask';
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "py-1.5 px-2 text-center tabular-nums cursor-pointer relative",
        "hover:bg-muted/50 transition-colors",
        isBid 
          ? side === 'YES' ? "text-success/80" : "text-destructive/80"
          : side === 'YES' ? "text-success/60" : "text-destructive/60",
        hasOrders && "ring-1 ring-inset ring-primary/50",
        isProfitable && isAsk && "ring-2 ring-success bg-success/10",
        className
      )}
    >
      {value > 0 ? value.toLocaleString() : '—'}
      {hasOrders && (
        <span className={cn(
          "absolute -top-1 -right-1 text-[8px] px-1 py-0.5 rounded",
          side === 'YES' ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
        )}>
          L{orders[0].ladderIndex}
        </span>
      )}
    </div>
  );
}
