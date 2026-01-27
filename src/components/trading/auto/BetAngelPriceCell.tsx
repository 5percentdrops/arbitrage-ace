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
  return (
    <div 
      onClick={onClick}
      className={cn(
        "h-7 flex items-center justify-center font-mono text-xs font-bold",
        "transition-all cursor-pointer hover:bg-muted/50",
        // LTP styling with momentum colors
        isLTP && momentum === 'up' && "bg-[hsl(var(--betangel-ltp-up))]/30 text-success",
        isLTP && momentum === 'down' && "bg-[hsl(var(--betangel-ltp-down))]/30 text-destructive",
        isLTP && momentum === 'same' && "bg-[hsl(var(--betangel-ltp-same))]/30 text-yellow-500",
        // Profitable indicator
        isProfitable && !isLTP && "bg-success/10 text-success",
        // Default
        !isLTP && !isProfitable && "text-foreground"
      )}
    >
      {isLTP && <span className="mr-0.5 text-[10px]">►</span>}
      {price.toFixed(2)}
      {isLTP && <span className="ml-0.5 text-[10px]">◄</span>}
    </div>
  );
}
