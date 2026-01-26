import { Calculator, Zap, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { ArbitrageEdge } from '@/types/auto-trading';

interface SpreadCalculatorProps {
  edge: ArbitrageEdge | null;
  size: number;
  onSizeChange: (size: number) => void;
  minNetEdgePct: number;
  onMinEdgeChange: (pct: number) => void;
  autoTradeEnabled: boolean;
  onAutoTradeToggle: (enabled: boolean) => void;
  onDeployLadder: () => void;
  isDeploying: boolean;
  hasSelection: boolean;
}

export function SpreadCalculator({
  edge,
  size,
  onSizeChange,
  minNetEdgePct,
  onMinEdgeChange,
  autoTradeEnabled,
  onAutoTradeToggle,
  onDeployLadder,
  isDeploying,
  hasSelection,
}: SpreadCalculatorProps) {
  const estimatedProfit = edge ? edge.netEdge * size : 0;
  const isProfitable = edge ? edge.netEdgePct >= minNetEdgePct : false;

  return (
    <Card className="border-border bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Spread Calculator</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-trade" className="text-xs text-muted-foreground">
              Auto Trade
            </Label>
            <Switch
              id="auto-trade"
              checked={autoTradeEnabled}
              onCheckedChange={onAutoTradeToggle}
              className="data-[state=checked]:bg-success"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Price Display */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/30 rounded p-2">
            <div className="text-xs text-muted-foreground">YES Price</div>
            <div className="font-mono text-sm font-bold text-success">
              {edge ? `$${edge.yesPrice.toFixed(2)}` : '—'}
            </div>
          </div>
          <div className="bg-muted/30 rounded p-2">
            <div className="text-xs text-muted-foreground">NO Price</div>
            <div className="font-mono text-sm font-bold text-destructive">
              {edge ? `$${edge.noPrice.toFixed(2)}` : '—'}
            </div>
          </div>
        </div>

        {/* Cost & Edge */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Total Cost</div>
            <div className="font-mono text-sm">
              {edge ? `$${edge.totalCost.toFixed(2)}` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Gross Edge</div>
            <div className={cn(
              "font-mono text-sm font-bold",
              edge && edge.grossEdgePct > 0 ? "text-success" : "text-muted-foreground"
            )}>
              {edge ? `${edge.grossEdgePct.toFixed(2)}%` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Net Edge</div>
            <div className={cn(
              "font-mono text-sm font-bold",
              edge && edge.netEdgePct >= minNetEdgePct 
                ? "text-success" 
                : edge && edge.netEdgePct > 0 
                  ? "text-warning" 
                  : "text-muted-foreground"
            )}>
              {edge ? `${edge.netEdgePct.toFixed(2)}%` : '—'}
            </div>
          </div>
        </div>

        {/* Size Input */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="size" className="text-xs text-muted-foreground">
              Size (Shares)
            </Label>
            <Input
              id="size"
              type="number"
              min={1}
              step={1}
              value={size}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              className="h-8 font-mono"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="min-edge" className="text-xs text-muted-foreground">
              Min Edge %
            </Label>
            <Input
              id="min-edge"
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={minNetEdgePct}
              onChange={(e) => onMinEdgeChange(Number(e.target.value))}
              className="h-8 font-mono"
            />
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="bg-muted/30 rounded p-2 text-center">
          <div className="text-xs text-muted-foreground">Est. Profit (per share pair)</div>
          <div className={cn(
            "font-mono text-lg font-bold",
            isProfitable ? "text-success" : "text-muted-foreground"
          )}>
            ${estimatedProfit.toFixed(4)} × {size} = ${(estimatedProfit * size).toFixed(2)}
          </div>
        </div>

        {/* Deploy Button */}
        <Button
          onClick={onDeployLadder}
          disabled={!hasSelection || isDeploying || !isProfitable}
          className="w-full"
          variant={isProfitable ? "default" : "secondary"}
        >
          {isDeploying ? (
            <>
              <Zap className="h-4 w-4 animate-pulse" />
              Deploying...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Deploy 7-Order Ladder
            </>
          )}
        </Button>

        {!hasSelection && (
          <p className="text-xs text-muted-foreground text-center">
            Click on the ladder to select prices
          </p>
        )}

        {hasSelection && !isProfitable && edge && (
          <div className="flex items-center gap-1 text-xs text-warning justify-center">
            <AlertTriangle className="h-3 w-3" />
            Edge below minimum threshold
          </div>
        )}
      </CardContent>
    </Card>
  );
}
