import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, Layers } from 'lucide-react';
import { CompoundingSettings } from '@/types/trading';

interface CompoundingControlsProps {
  settings: CompoundingSettings;
  onUpdate: (settings: Partial<CompoundingSettings>) => void;
  disabled?: boolean;
}

export function CompoundingControls({
  settings,
  onUpdate,
  disabled = false,
}: CompoundingControlsProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" />
          Compounding Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-compound" className="text-sm font-medium">
              Auto-Compound
            </Label>
            <p className="text-xs text-muted-foreground">
              Reinvest profits automatically
            </p>
          </div>
          <Switch
            id="auto-compound"
            checked={settings.enabled}
            onCheckedChange={(checked) => onUpdate({ enabled: checked })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-capital" className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Coins className="h-3 w-3" />
            Max Capital Per Trade (USD)
          </Label>
          <Input
            id="max-capital"
            type="number"
            min={10}
            max={10000}
            step={10}
            value={settings.maxCapitalPerTrade}
            onChange={(e) => onUpdate({ maxCapitalPerTrade: Number(e.target.value) })}
            disabled={disabled}
            className="bg-background/50 border-border/50 h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-positions" className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3 w-3" />
            Max Simultaneous Positions
          </Label>
          <Input
            id="max-positions"
            type="number"
            min={1}
            max={20}
            step={1}
            value={settings.maxSimultaneousPositions}
            onChange={(e) => onUpdate({ maxSimultaneousPositions: Number(e.target.value) })}
            disabled={disabled}
            className="bg-background/50 border-border/50 h-9"
          />
        </div>
      </CardContent>
    </Card>
  );
}
