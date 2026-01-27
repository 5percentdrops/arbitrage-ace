import { cn } from '@/lib/utils';

interface SpreadIndicatorProps {
  yesBestAsk: number;
  noBestAsk: number;
}

export function SpreadIndicator({ yesBestAsk, noBestAsk }: SpreadIndicatorProps) {
  const totalCost = yesBestAsk + noBestAsk;
  const hasArb = totalCost < 1.0;
  const arbPct = hasArb ? ((1 - totalCost) * 100).toFixed(1) : '0';
  const spreadCents = Math.abs(Math.round((totalCost - 1) * 100));
  
  return (
    <div className="flex flex-col items-center justify-center py-4 px-2">
      <div className={cn(
        "px-4 py-2 rounded-full font-mono text-sm font-bold transition-colors",
        hasArb 
          ? "bg-success/20 text-success border border-success/50"
          : "bg-muted text-muted-foreground border border-border"
      )}>
        {hasArb ? (
          <>Arb: +{arbPct}%</>
        ) : (
          <>Spread: {spreadCents}¢</>
        )}
      </div>
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
