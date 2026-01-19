import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FilterParams } from '@/types/trading';
import { Filter, Clock } from 'lucide-react';

interface FiltersPanelProps {
  filters: FilterParams;
  onUpdate: (filters: Partial<FilterParams>) => void;
}

const TIME_INTERVALS = [
  { label: '15m', minutes: 15 },
];

export function FiltersPanel({ filters, onUpdate }: FiltersPanelProps) {
  const handleTimeIntervalSelect = (minutes: number) => {
    onUpdate({
      minTimeToSettlement: 0,
      maxTimeToSettlement: minutes,
    });
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          Filters & Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Interval Quick Select */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Time Interval
          </Label>
          <div className="flex gap-2">
            {TIME_INTERVALS.map((interval) => (
              <Button
                key={interval.label}
                variant={filters.maxTimeToSettlement === interval.minutes ? "default" : "outline"}
                size="sm"
                className="flex-1 font-mono text-xs"
                onClick={() => handleTimeIntervalSelect(interval.minutes)}
              >
                {interval.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Min Liquidity ($)</Label>
            <Input
              type="number"
              value={filters.minLiquidity}
              onChange={(e) => onUpdate({ minLiquidity: Number(e.target.value) })}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Max Liquidity ($)</Label>
            <Input
              type="number"
              value={filters.maxLiquidity}
              onChange={(e) => onUpdate({ maxLiquidity: Number(e.target.value) })}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Min Volume ($)</Label>
            <Input
              type="number"
              value={filters.minVolume}
              onChange={(e) => onUpdate({ minVolume: Number(e.target.value) })}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Max Volume ($)</Label>
            <Input
              type="number"
              value={filters.maxVolume}
              onChange={(e) => onUpdate({ maxVolume: Number(e.target.value) })}
              className="font-mono text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
