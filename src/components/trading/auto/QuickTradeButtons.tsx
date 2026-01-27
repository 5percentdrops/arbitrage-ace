import { Button } from '@/components/ui/button';

interface QuickTradeButtonsProps {
  yesPrice: number;
  noPrice: number;
  stake: number;
  onBuyYes: () => void;
  onBuyNo: () => void;
  disabled?: boolean;
}

export function QuickTradeButtons({ 
  yesPrice, 
  noPrice, 
  stake, 
  onBuyYes, 
  onBuyNo,
  disabled = false 
}: QuickTradeButtonsProps) {
  const yesCents = Math.round(yesPrice * 100);
  const noCents = Math.round(noPrice * 100);
  const yesPayout = stake > 0 ? Math.round((stake / yesPrice) * 100) / 100 : 0;
  const noPayout = stake > 0 ? Math.round((stake / noPrice) * 100) / 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-3 p-4 border-t border-border">
      <Button 
        onClick={onBuyYes}
        disabled={disabled}
        className="h-14 bg-[hsl(var(--poly-yes))] hover:bg-[hsl(var(--poly-yes))]/90 text-white flex flex-col items-center justify-center gap-0.5"
      >
        <span className="font-bold text-sm">Buy Yes</span>
        <span className="text-xs opacity-90 font-mono">
          {yesCents}¢ → Win ${yesPayout.toFixed(0)}
        </span>
      </Button>
      <Button 
        onClick={onBuyNo}
        disabled={disabled}
        className="h-14 bg-[hsl(var(--poly-no))] hover:bg-[hsl(var(--poly-no))]/90 text-white flex flex-col items-center justify-center gap-0.5"
      >
        <span className="font-bold text-sm">Buy No</span>
        <span className="text-xs opacity-90 font-mono">
          {noCents}¢ → Win ${noPayout.toFixed(0)}
        </span>
      </Button>
    </div>
  );
}
