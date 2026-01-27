import { cn } from '@/lib/utils';
import type { ActiveLadderOrder } from '@/types/auto-trading';

interface BetAngelCellProps {
  value: number;
  maxDepth: number;
  type: 'back' | 'lay';
  onClick?: () => void;
  hasOrder?: boolean;
  orderLabel?: string;
}

export function BetAngelCell({ 
  value, 
  maxDepth, 
  type, 
  onClick, 
  hasOrder,
  orderLabel 
}: BetAngelCellProps) {
  const depthPercent = maxDepth > 0 ? Math.min((value / maxDepth) * 100, 100) : 0;
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative h-7 flex items-center justify-center cursor-pointer",
        "font-mono text-xs font-semibold transition-all",
        "hover:brightness-110 active:brightness-90",
        type === 'back' 
          ? "text-foreground" 
          : "text-foreground",
        hasOrder && "ring-2 ring-inset ring-primary/80"
      )}
    >
      {/* Depth bar background - grows from right for back, left for lay */}
      <div 
        className={cn(
          "absolute inset-y-0 transition-all duration-150",
          type === 'back' 
            ? "right-0 bg-[hsl(var(--betangel-back))]" 
            : "left-0 bg-[hsl(var(--betangel-lay))]"
        )}
        style={{ width: `${depthPercent}%` }}
      />
      
      {/* Value text */}
      <span className="relative z-10 drop-shadow-sm">
        {value > 0 ? value.toLocaleString() : '—'}
      </span>
      
      {/* Order indicator badge */}
      {hasOrder && orderLabel && (
        <span className={cn(
          "absolute top-0.5 text-[8px] px-1 py-0.5 rounded font-bold z-20",
          "bg-primary text-primary-foreground",
          type === 'back' ? "right-0.5" : "left-0.5"
        )}>
          {orderLabel}
        </span>
      )}
    </div>
  );
}
