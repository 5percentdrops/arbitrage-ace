import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceMetrics } from '@/types/trading';
import { formatCurrency } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Percent, Trophy } from 'lucide-react';

interface PerformancePanelProps {
  metrics: PerformanceMetrics;
}

export function PerformancePanel({ metrics }: PerformancePanelProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              Realized PnL
            </div>
            <p className={cn(
              "font-mono text-lg font-semibold",
              metrics.realizedPnl >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(metrics.realizedPnl)}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              Unrealized PnL
            </div>
            <p className={cn(
              "font-mono text-lg font-semibold",
              metrics.unrealizedPnl >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(metrics.unrealizedPnl)}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              {metrics.dailyPnl >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              Daily PnL
            </div>
            <p className={cn(
              "font-mono text-lg font-semibold",
              metrics.dailyPnl >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(metrics.dailyPnl)}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Percent className="h-3 w-3" />
              ROI
            </div>
            <p className={cn(
              "font-mono text-lg font-semibold",
              metrics.roiPercent >= 0 ? "text-success" : "text-destructive"
            )}>
              {metrics.roiPercent >= 0 ? '+' : ''}{metrics.roiPercent}%
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="text-xs text-muted-foreground mb-1">Total Trades</div>
            <p className="font-mono text-lg font-semibold">{metrics.totalTrades}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
            <p className="font-mono text-lg font-semibold text-success">{metrics.winRate}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
