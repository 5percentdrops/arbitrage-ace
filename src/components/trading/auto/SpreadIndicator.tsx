import { cn } from '@/lib/utils';

interface SpreadIndicatorProps {
  yesBestAsk: number;
  noBestAsk: number;
  bestArbPct?: number;      // Actual best arb percentage from level edges
  arbLevelCount?: number;   // Number of profitable levels available
}

export function SpreadIndicator({ 
  yesBestAsk, 
  noBestAsk, 
  bestArbPct,
  arbLevelCount = 0 
}: SpreadIndicatorProps) {
  const totalCost = yesBestAsk + noBestAsk;
  const hasArb = bestArbPct !== undefined && bestArbPct > 0 && arbLevelCount > 0;
  const spreadCents = Math.abs(Math.round((totalCost - 1) * 100));
  
  return (
    <div className="flex flex-col items-center justify-center py-4 px-2">
      <div className={cn(
        "px-4 py-2 rounded-full font-mono text-sm font-bold transition-all duration-300",
        hasArb 
          ? "bg-success/20 text-success border border-success/50 glow-success animate-pulse"
          : "bg-muted text-muted-foreground border border-border"
      )}>
        {hasArb ? (
          <>Arb: +{bestArbPct.toFixed(2)}%</>
        ) : (
          <>Spread: {spreadCents}¢</>
        )}
      </div>
      
      {/* Level count when arb available */}
      {hasArb && arbLevelCount > 0 && (
        <div className="text-xs text-success font-medium mt-1">
          {arbLevelCount} level{arbLevelCount !== 1 ? 's' : ''}
        </div>
      )}
      
      <div className="text-[10px] text-muted-foreground mt-2 text-center font-mono">
        <span className="text-[hsl(var(--poly-yes))]">{Math.round(yesBestAsk * 100)}¢</span>
        {' + '}
        <span className="text-[hsl(var(--poly-no))]">{Math.round(noBestAsk * 100)}¢</span>
        {' = '}
        <span className={hasArb ? 'text-success font-bold' : ''}>
          {Math.round(totalCost * 100)}¢
        </span>
      </div>
    </div>
  );
}
