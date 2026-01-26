import { cn } from '@/lib/utils';
import type { OrderBookLevel, LadderSelection, ActiveLadderOrder } from '@/types/auto-trading';

interface LadderRowProps {
  level: OrderBookLevel;
  isSelected: boolean;
  isProfitable: boolean;
  isSuggested: boolean;
  isMidpoint: boolean;
  yesOrders: ActiveLadderOrder[];
  noOrders: ActiveLadderOrder[];
  onYesClick: (type: 'bid' | 'ask') => void;
  onNoClick: (type: 'bid' | 'ask') => void;
}

export function LadderRow({
  level,
  isSelected,
  isProfitable,
  isSuggested,
  isMidpoint,
  yesOrders,
  noOrders,
  onYesClick,
  onNoClick,
}: LadderRowProps) {
  const noPrice = 1 - level.price;

  return (
    <div
      className={cn(
        "grid grid-cols-9 text-xs font-mono border-b border-border/50 transition-all duration-150",
        isSelected && "bg-primary/20 border-primary/50",
        isProfitable && !isSelected && "bg-success/10",
        isSuggested && "ring-1 ring-dashed ring-warning",
        isMidpoint && "border-b-2 border-b-primary"
      )}
    >
      {/* YES Side */}
      <Cell
        value={level.yesBid}
        type="bid"
        side="YES"
        onClick={() => onYesClick('bid')}
        orders={yesOrders.filter(o => o.price === level.price)}
      />
      <Cell
        value={level.price}
        isPrice
        className="text-success font-bold"
      />
      <Cell
        value={level.yesAsk}
        type="ask"
        side="YES"
        onClick={() => onYesClick('ask')}
        orders={[]}
      />

      {/* Separator with edge indicator */}
      <div className="col-span-3 flex items-center justify-center bg-muted/20 px-1">
        {isProfitable && (
          <span className="text-[10px] text-success font-bold px-1 py-0.5 bg-success/20 rounded">
            EDGE
          </span>
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
  className?: string;
  onClick?: () => void;
  orders?: ActiveLadderOrder[];
}

function Cell({ value, type, side, isPrice, className, onClick, orders = [] }: CellProps) {
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
