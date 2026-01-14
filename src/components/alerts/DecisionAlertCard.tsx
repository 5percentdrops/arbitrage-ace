import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, TrendingDown, Clock, Loader2 } from 'lucide-react';
import type { DecisionAlert, AlertAction, AlertSignal } from '@/types/decision-alerts';

interface DecisionAlertCardProps {
  alert: DecisionAlert;
  onAction: (id: string, action: AlertAction) => Promise<boolean>;
  isActionInFlight: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatSignal(signal: AlertSignal): string {
  const prefix = signal.signal_type === 'CVD_DIV' ? 'CVD' : 'FR';
  const arrow = signal.direction === 'BULLISH' ? '↑' : '↓';
  return `${prefix}${arrow} (${signal.timeframe})`;
}

function getSignalSummary(signals: AlertSignal[]): string {
  if (signals.length === 0) return 'None';
  return signals.map(formatSignal).join(' + ');
}

function getStatusColor(status: DecisionAlert['status']): string {
  switch (status) {
    case 'READY': return 'bg-success/20 text-success border-success/30';
    case 'EXECUTING': return 'bg-warning/20 text-warning border-warning/30';
    case 'EXECUTED': return 'bg-primary/20 text-primary border-primary/30';
    case 'REJECTED':
    case 'SKIPPED': return 'bg-destructive/20 text-destructive border-destructive/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

export function DecisionAlertCard({ alert, onAction, isActionInFlight }: DecisionAlertCardProps) {
  const [loadingAction, setLoadingAction] = useState<AlertAction | null>(null);
  
  const isEntryBlocked = alert.seconds_remaining < 300;
  const isExecuting = alert.status === 'EXECUTING';
  const buyDisabled = isEntryBlocked || isExecuting || isActionInFlight;

  const handleAction = async (action: AlertAction) => {
    setLoadingAction(action);
    await onAction(alert.id, action);
    setLoadingAction(null);
  };

  return (
    <Card className="border-border hover:border-primary/30 transition-colors">
      <CardContent className="p-4 space-y-1.5 font-mono text-sm">
        {/* Line 1: Asset • 15m   MM:SS left   STATUS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{alert.asset}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">15m</span>
            <span className="text-muted-foreground">|</span>
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className={alert.seconds_remaining < 300 ? 'text-destructive' : 'text-foreground'}>
              {formatTime(alert.seconds_remaining)} left
            </span>
          </div>
          <Badge variant="outline" className={getStatusColor(alert.status)}>
            {alert.status}
          </Badge>
        </div>

        {/* Line 2: Crowd: UP 67%   Prices: UP 0.42 | DOWN 0.58 */}
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>
            Crowd: 
            <span className={alert.majority_side === 'UP' ? 'text-success ml-1' : 'text-destructive ml-1'}>
              {alert.majority_side}
            </span>
            {alert.majority_pct !== undefined ? (
              <span className="ml-1">{alert.majority_pct}%</span>
            ) : (
              <span className="ml-1 text-xs">(proxy)</span>
            )}
          </span>
          <span className="text-muted-foreground/50">|</span>
          <span>
            Prices: 
            <span className="text-success ml-1">UP {alert.up_price.toFixed(2)}</span>
            <span className="mx-1">|</span>
            <span className="text-destructive">DOWN {alert.down_price.toFixed(2)}</span>
          </span>
        </div>

        {/* Line 3: Signals: CVD↓ (1m) + FR↓ (1m)   Score: 8/10 */}
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>Signals: <span className="text-foreground">{getSignalSummary(alert.signals)}</span></span>
          <span className="text-muted-foreground/50">|</span>
          <span>Score: <span className="text-primary font-semibold">{alert.score}/10</span></span>
        </div>

        {/* Line 4: Liquidity: Spread 0.02 OK   Size: $1,250/$1,180 */}
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>
            Liquidity: Spread {alert.liquidity.spread.toFixed(3)} 
            <span className={alert.liquidity.spread_ok ? 'text-success ml-1' : 'text-warning ml-1'}>
              {alert.liquidity.spread_ok ? 'OK' : 'WIDE'}
            </span>
          </span>
          {(alert.liquidity.best_bid_size_usd || alert.liquidity.best_ask_size_usd) && (
            <>
              <span className="text-muted-foreground/50">|</span>
              <span>
                Size: ${alert.liquidity.best_bid_size_usd?.toLocaleString() ?? '-'}/
                ${alert.liquidity.best_ask_size_usd?.toLocaleString() ?? '-'}
              </span>
            </>
          )}
        </div>

        {/* Line 5: Actions */}
        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <Button
            size="sm"
            variant={alert.recommended_side === 'BUY_UP' ? 'default' : 'outline'}
            className={alert.recommended_side === 'BUY_UP' ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}
            disabled={buyDisabled}
            onClick={() => handleAction('BUY_UP')}
          >
            {loadingAction === 'BUY_UP' ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <TrendingUp className="h-3 w-3 mr-1" />
            )}
            Buy UP
            {alert.recommended_side === 'BUY_UP' && ' ★'}
          </Button>

          <Button
            size="sm"
            variant={alert.recommended_side === 'BUY_DOWN' ? 'default' : 'outline'}
            className={alert.recommended_side === 'BUY_DOWN' ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}
            disabled={buyDisabled}
            onClick={() => handleAction('BUY_DOWN')}
          >
            {loadingAction === 'BUY_DOWN' ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            Buy DOWN
            {alert.recommended_side === 'BUY_DOWN' && ' ★'}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            disabled={isActionInFlight}
            onClick={() => handleAction('IGNORE')}
          >
            {loadingAction === 'IGNORE' && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            Ignore
          </Button>

          <Button
            size="sm"
            variant="ghost"
            disabled={isActionInFlight}
            onClick={() => handleAction('SNOOZE')}
          >
            {loadingAction === 'SNOOZE' && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            Snooze
          </Button>

          {isEntryBlocked && (
            <div className="flex items-center gap-1 text-xs text-destructive ml-2">
              <AlertCircle className="h-3 w-3" />
              <span>Entry blocked (&lt; 5:00 remaining)</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
