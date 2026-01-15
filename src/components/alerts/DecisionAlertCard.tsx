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

function SignalBadge({ signal }: { signal: AlertSignal }) {
  const prefix = signal.signal_type === 'CVD_DIV' ? 'CVD' : 'FR';
  const arrow = signal.direction === 'BULLISH' ? '↑' : '↓';
  const colorClass = signal.direction === 'BULLISH' ? 'text-success' : 'text-destructive';
  return (
    <span>
      {prefix}<span className={colorClass}>{arrow}</span> ({signal.timeframe})
    </span>
  );
}

function SignalSummary({ signals }: { signals: AlertSignal[] }) {
  if (signals.length === 0) return <span>None</span>;
  return (
    <>
      {signals.map((signal, idx) => (
        <span key={idx}>
          {idx > 0 && ' + '}
          <SignalBadge signal={signal} />
        </span>
      ))}
    </>
  );
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
          <span>Signals: <span className="text-foreground"><SignalSummary signals={alert.signals} /></span></span>
          <span className="text-muted-foreground/50">|</span>
          <span>Score: <span className="text-primary font-semibold">{alert.score}/10</span></span>
        </div>

        {/* Line 4: Spread: 2.0%   Volume: $1,250 */}
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>Spread: <span className="text-foreground">{(alert.liquidity.spread * 100).toFixed(1)}%</span></span>
          {alert.liquidity.best_bid_size_usd && (
            <>
              <span className="text-muted-foreground/50">|</span>
              <span>Volume: <span className="text-foreground">${alert.liquidity.best_bid_size_usd.toLocaleString()}</span></span>
            </>
          )}
        </div>

        {/* Line 5: Actions - Single contrarian button (opposite of crowd) */}
        <div className="flex items-center gap-2 pt-2 flex-wrap">
          {(() => {
            const contrarianAction = alert.majority_side === 'UP' ? 'BUY_DOWN' : 'BUY_UP';
            const ContrarianIcon = alert.majority_side === 'UP' ? TrendingDown : TrendingUp;
            const buttonLabel = alert.majority_side === 'UP' ? 'Buy DOWN' : 'Buy UP';
            
            return (
              <Button
                size="sm"
                variant="default"
                className="bg-success hover:bg-success/90 text-success-foreground"
                disabled={buyDisabled}
                onClick={() => handleAction(contrarianAction)}
              >
                {loadingAction === contrarianAction ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <ContrarianIcon className="h-3 w-3 mr-1" />
                )}
                {buttonLabel}
              </Button>
            );
          })()}

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
