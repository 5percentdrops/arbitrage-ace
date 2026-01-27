import { cn } from '@/lib/utils';

export type PriceMomentum = 'up' | 'down' | 'same';

interface BetAngelPriceCellProps {
  price: number;
  isLTP?: boolean;
  momentum?: PriceMomentum;
  isProfitable?: boolean;
  onClick?: () => void;
}

export function BetAngelPriceCell({ 
  price, 
  isLTP, 
  momentum = 'same',
  isProfitable,
  onClick 
}: BetAngelPriceCellProps) {
  const cents = Math.round(price * 100);
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "h-9 flex flex-col items-center justify-center font-mono cursor-pointer",
        "transition-all hover:bg-muted/50",
        // LTP styling with momentum colors
        isLTP && momentum === 'up' && "bg-[hsl(var(--betangel-ltp-up))]/30",
        isLTP && momentum === 'down' && "bg-[hsl(var(--betangel-ltp-down))]/30",
        isLTP && momentum === 'same' && "bg-[hsl(var(--betangel-ltp-same))]/30",
        // Profitable indicator
        isProfitable && !isLTP && "bg-success/10",
        // Default
        !isLTP && !isProfitable && ""
      )}
    >
      <div className={cn(
        "flex items-center text-sm font-bold",
        isLTP && momentum === 'up' && "text-success",
        isLTP && momentum === 'down' && "text-destructive",
        isLTP && momentum === 'same' && "text-[hsl(var(--poly-spread))]",
        isProfitable && !isLTP && "text-success",
        !isLTP && !isProfitable && "text-foreground"
      )}>
        {isLTP && <span className="mr-0.5 text-[10px]">►</span>}
        {cents}¢
        {isLTP && <span className="ml-0.5 text-[10px]">◄</span>}
      </div>
      <div className="text-[9px] text-muted-foreground">
        {cents}%
      </div>
    </div>
  );
}
