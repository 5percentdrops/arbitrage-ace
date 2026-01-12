import { TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { BotStateResponse } from '@/types/manual-trading';
import type { TokenSymbol } from '@/types/trading';
import { cn } from '@/lib/utils';

interface PositionsPnlCardProps {
  asset: TokenSymbol;
  botState: BotStateResponse | null;
  isLoading: boolean;
  error: string | null;
}

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  OBSERVATION: { label: 'Observation', color: 'bg-muted text-muted-foreground' },
  DISCOVERY_ARMED: { label: 'Discovery Armed', color: 'bg-warning/20 text-warning' },
  LEG1_PENDING: { label: 'Leg 1 Pending', color: 'bg-primary/20 text-primary' },
  LEG2_PENDING: { label: 'Leg 2 Pending', color: 'bg-primary/20 text-primary' },
  HEDGED: { label: 'Hedged', color: 'bg-success/20 text-success' },
  IDLE: { label: 'Idle', color: 'bg-muted text-muted-foreground' },
};

function formatPnl(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${value.toFixed(2)}`;
}

export function PositionsPnlCard({
  asset,
  botState,
  isLoading,
  error,
}: PositionsPnlCardProps) {
  // Only show if there's an active position
  const hasActivePosition = botState 
    ? (botState.leg1SharesFilled > 0 || botState.leg2SharesFilled > 0)
    : false;

  // Don't render if no active position
  if (!hasActivePosition && !isLoading && !error) {
    return null;
  }

  const stateInfo = botState 
    ? STATE_LABELS[botState.state] || STATE_LABELS.IDLE
    : STATE_LABELS.IDLE;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Position & PnL ({asset})
            </CardTitle>
          </div>
          {botState && (
            <Badge className={cn("text-xs", stateInfo.color)}>
              {stateInfo.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : isLoading && !botState ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : botState ? (
          <div className="space-y-4">
            {/* Leg Information */}
            <div className="grid grid-cols-2 gap-4">
              {/* Leg 1 */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Leg 1</span>
                  {botState.leg1SharesFilled > 0 && (
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shares</span>
                    <span className="font-mono font-medium">{botState.leg1SharesFilled}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Price</span>
                    <span className="font-mono">${botState.leg1AvgPrice.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invested</span>
                    <span className="font-mono">
                      ${(botState.leg1SharesFilled * botState.leg1AvgPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Leg 2 */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Leg 2</span>
                  {botState.leg2SharesFilled > 0 && (
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shares</span>
                    <span className="font-mono font-medium">{botState.leg2SharesFilled}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Price</span>
                    <span className="font-mono">${botState.leg2AvgPrice.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invested</span>
                    <span className="font-mono">
                      ${(botState.leg2SharesFilled * botState.leg2AvgPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Equality Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Share Equality</span>
                <span className="font-mono">{Math.round(botState.shareEqualityProgress)}%</span>
              </div>
              <Progress 
                value={botState.shareEqualityProgress} 
                className="h-2 bg-muted"
              />
            </div>

            {/* PnL */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Unrealized PnL</span>
                <p
                  className={cn(
                    "text-lg font-mono font-bold",
                    botState.unrealizedPnl >= 0 ? "text-success" : "text-destructive"
                  )}
                >
                  {formatPnl(botState.unrealizedPnl)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Realized PnL</span>
                <p
                  className={cn(
                    "text-lg font-mono font-bold",
                    botState.realizedPnl >= 0 ? "text-success" : "text-destructive"
                  )}
                >
                  {formatPnl(botState.realizedPnl)}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
