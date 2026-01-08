import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Ruler } from 'lucide-react';
import { PositionSizeSettings } from '@/types/trading';

interface PositionSizePanelProps {
  settings: PositionSizeSettings;
  onUpdate: (settings: Partial<PositionSizeSettings>) => void;
  disabled?: boolean;
}

export function PositionSizePanel({
  settings,
  onUpdate,
  disabled = false,
}: PositionSizePanelProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Ruler className="h-4 w-4 text-primary" />
          Position Size
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="defaultSize" className="text-xs text-muted-foreground">
            Default Size (USD)
          </Label>
          <Input
            id="defaultSize"
            type="number"
            min={1}
            value={settings.defaultSize}
            onChange={(e) => onUpdate({ defaultSize: Number(e.target.value) })}
            disabled={disabled}
            className="h-8 text-sm font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="minSize" className="text-xs text-muted-foreground">
              Min Size (USD)
            </Label>
            <Input
              id="minSize"
              type="number"
              min={1}
              value={settings.minSize}
              onChange={(e) => onUpdate({ minSize: Number(e.target.value) })}
              disabled={disabled}
              className="h-8 text-sm font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxSize" className="text-xs text-muted-foreground">
              Max Size (USD)
            </Label>
            <Input
              id="maxSize"
              type="number"
              min={1}
              value={settings.maxSize}
              onChange={(e) => onUpdate({ maxSize: Number(e.target.value) })}
              disabled={disabled}
              className="h-8 text-sm font-mono"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
