import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DoorOpen, Clock, TrendingUp } from 'lucide-react';
import { ExitSettings, ExitMode } from '@/types/trading';

interface ExitLogicPanelProps {
  settings: ExitSettings;
  onUpdate: (settings: Partial<ExitSettings>) => void;
  disabled?: boolean;
}

export function ExitLogicPanel({
  settings,
  onUpdate,
  disabled = false,
}: ExitLogicPanelProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DoorOpen className="h-4 w-4 text-primary" />
          Exit Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={settings.mode}
          onValueChange={(value: ExitMode) => onUpdate({ mode: value })}
          disabled={disabled}
          className="space-y-3"
        >
          <div className={`flex items-start space-x-3 p-3 rounded-lg border border-border/50 hover:bg-background/50 transition-colors ${settings.mode === 'hold_to_settlement' ? 'bg-primary/5 border-primary/30' : 'bg-background/30'}`}>
            <RadioGroupItem value="hold_to_settlement" id="hold" className="mt-0.5" />
            <div className="space-y-1">
              <Label htmlFor="hold" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Hold to Settlement
              </Label>
              <p className="text-xs text-muted-foreground">
                Hold positions until market resolves. Maximizes profit if prediction is correct.
              </p>
            </div>
          </div>

          <div className={`flex items-start space-x-3 p-3 rounded-lg border border-border/50 hover:bg-background/50 transition-colors ${settings.mode === 'sell_at_threshold' ? 'bg-primary/5 border-primary/30' : 'bg-background/30'}`}>
            <RadioGroupItem value="sell_at_threshold" id="threshold" className="mt-0.5" />
            <div className="space-y-1">
              <Label htmlFor="threshold" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                Sell at Threshold
              </Label>
              <p className="text-xs text-muted-foreground">
                Exit early when position value reaches target. Locks in profits sooner.
              </p>
            </div>
          </div>
        </RadioGroup>

        {settings.mode === 'sell_at_threshold' && (
          <div className="space-y-2 pt-2 border-t border-border/30">
            <Label htmlFor="pnl-percent" className="text-xs text-muted-foreground">
              PNL %
            </Label>
            <Input
              id="pnl-percent"
              type="number"
              min={1}
              max={100}
              step={1}
              value={settings.pnlPercent}
              onChange={(e) => onUpdate({ pnlPercent: Number(e.target.value) })}
              disabled={disabled}
              className="bg-background/50 border-border/50 h-9"
            />
            <p className="text-xs text-muted-foreground">
              Exit when profit reaches {settings.pnlPercent}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
