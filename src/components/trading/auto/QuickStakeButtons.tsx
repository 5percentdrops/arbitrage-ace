import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface QuickStakeButtonsProps {
  currentStake: number;
  onStakeChange: (stake: number) => void;
  stakes?: number[];
}

const DEFAULT_STAKES = [50, 100, 250, 500, 1000];

export function QuickStakeButtons({ 
  currentStake, 
  onStakeChange, 
  stakes = DEFAULT_STAKES 
}: QuickStakeButtonsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {stakes.map(stake => (
        <Button 
          key={stake}
          variant="outline" 
          size="sm"
          onClick={() => onStakeChange(stake)}
          className={cn(
            "h-7 px-2.5 font-mono text-xs transition-all",
            currentStake === stake 
              ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
              : "hover:bg-muted"
          )}
        >
          ${stake >= 1000 ? `${stake/1000}K` : stake}
        </Button>
      ))}
    </div>
  );
}
