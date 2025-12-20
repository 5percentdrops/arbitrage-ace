import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FilterParams } from '@/types/trading';
import { Filter } from 'lucide-react';

interface FiltersPanelProps {
  filters: FilterParams;
  onUpdate: (filters: Partial<FilterParams>) => void;
}

export function FiltersPanel({ filters, onUpdate }: FiltersPanelProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          Filters & Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <Label className="text-xs text-muted-foreground">Min Volume ($)</Label>
            <Input
              type="number"
              value={filters.minVolume}
              onChange={(e) => onUpdate({ minVolume: Number(e.target.value) })}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Min Spread</Label>
            <Input
              type="number"
              step="0.01"
              value={filters.minSpread}
              onChange={(e) => onUpdate({ minSpread: Number(e.target.value) })}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Max Spread</Label>
            <Input
              type="number"
              step="0.01"
              value={filters.maxSpread}
              onChange={(e) => onUpdate({ maxSpread: Number(e.target.value) })}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Min Time (min)</Label>
            <Input
              type="number"
              value={filters.minTimeToSettlement}
              onChange={(e) => onUpdate({ minTimeToSettlement: Number(e.target.value) })}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Max Time (min)</Label>
            <Input
              type="number"
              value={filters.maxTimeToSettlement}
              onChange={(e) => onUpdate({ maxTimeToSettlement: Number(e.target.value) })}
              className="font-mono text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
