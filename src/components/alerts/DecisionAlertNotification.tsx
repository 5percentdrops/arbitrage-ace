import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X, Clock, TrendingUp, TrendingDown, Loader2, AlertCircle, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DecisionAlert, AlertAction, AlertSignal } from '@/types/decision-alerts';

interface DecisionAlertNotificationProps {
  alerts: DecisionAlert[];
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
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

export function DecisionAlertNotification({
  alerts,
  isVisible,
  onVisibilityChange,
  onAction,
  isActionInFlight
}: DecisionAlertNotificationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingAction, setLoadingAction] = useState<AlertAction | null>(null);
  const previousAlertsLength = useRef(0);
  const hasAutoShown = useRef(false);

  // Reset index when alerts change significantly
  useEffect(() => {
    if (alerts.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= alerts.length) {
      setCurrentIndex(Math.max(0, alerts.length - 1));
    }
  }, [alerts.length, currentIndex]);

  // Auto-show on initial load when alerts exist
  useEffect(() => {
    if (alerts.length > 0 && !hasAutoShown.current) {
      hasAutoShown.current = true;
      onVisibilityChange(true);
    }
  }, [alerts.length, onVisibilityChange]);

  // Show when new alerts arrive (after initial load)
  useEffect(() => {
    if (alerts.length > previousAlertsLength.current && previousAlertsLength.current > 0) {
      onVisibilityChange(true);
    }
    previousAlertsLength.current = alerts.length;
  }, [alerts.length, onVisibilityChange]);

  const currentAlert = alerts[currentIndex];
  const hasMultiple = alerts.length > 1;

  const handleAction = async (action: AlertAction) => {
    if (!currentAlert) return;
    setLoadingAction(action);
    const success = await onAction(currentAlert.id, action);
    setLoadingAction(null);
    if (success && alerts.length === 1) {
      onVisibilityChange(false);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVisibilityChange(false);
    setIsExpanded(false);
  };

  const handleCollapsedClick = () => {
    setIsExpanded(true);
  };

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : alerts.length - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < alerts.length - 1 ? prev + 1 : 0));
  };

  if (!isVisible || !currentAlert) return null;

  const isEntryBlocked = currentAlert.seconds_remaining < 300;
  const isExecuting = currentAlert.status === 'EXECUTING';
  const buyDisabled = isEntryBlocked || isExecuting || isActionInFlight;

  // Collapsed view
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-[150] animate-slide-in-right">
        <Card 
          className="w-80 cursor-pointer border-primary/50 shadow-lg hover:border-primary transition-colors bg-card/95 backdrop-blur-sm"
          onClick={handleCollapsedClick}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary animate-pulse" />
                <span className="font-semibold text-foreground">{currentAlert.asset}</span>
                <span className="text-muted-foreground">•</span>
                <span className={cn(
                  "text-sm",
                  currentAlert.seconds_remaining < 300 ? "text-destructive" : "text-muted-foreground"
                )}>
                  {formatTime(currentAlert.seconds_remaining)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-destructive/20"
                onClick={handleClose}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Rec: </span>
                <span className={cn(
                  "font-medium",
                  currentAlert.recommended_side === 'BUY_UP' ? "text-success" : "text-destructive"
                )}>
                  {currentAlert.recommended_side === 'BUY_UP' ? '↑ Buy UP' : '↓ Buy DOWN'}
                </span>
                <span className="text-primary ml-1">★</span>
              </div>
              {hasMultiple && (
                <Badge variant="secondary" className="text-xs">
                  {alerts.length} alerts
                </Badge>
              )}
            </div>
            
            <div className="text-xs text-primary mt-2">Click to view options</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="fixed bottom-4 right-4 z-[150] animate-scale-in">
      <Card className="w-[420px] max-h-[70vh] overflow-y-auto shadow-xl border-primary/30 bg-card/98 backdrop-blur-sm">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="font-semibold">Trading Opportunity</span>
            {hasMultiple && (
              <span className="text-sm text-muted-foreground">
                ({currentIndex + 1} of {alerts.length})
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {hasMultiple && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevious}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNext}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-destructive/20 ml-1"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-2 font-mono text-sm">
          {/* Line 1: Asset • 15m   MM:SS left   STATUS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-base">{currentAlert.asset}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">15m</span>
              <span className="text-muted-foreground">|</span>
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className={currentAlert.seconds_remaining < 300 ? 'text-destructive font-semibold' : 'text-foreground'}>
                {formatTime(currentAlert.seconds_remaining)} left
              </span>
            </div>
            <Badge variant="outline" className={getStatusColor(currentAlert.status)}>
              {currentAlert.status}
            </Badge>
          </div>

          {/* Line 2: Crowd: UP 67%   Prices: UP 0.42 | DOWN 0.58 */}
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>
              Crowd: 
              <span className={currentAlert.majority_side === 'UP' ? 'text-success ml-1' : 'text-destructive ml-1'}>
                {currentAlert.majority_side}
              </span>
              {currentAlert.majority_pct !== undefined ? (
                <span className="ml-1">{currentAlert.majority_pct}%</span>
              ) : (
                <span className="ml-1 text-xs">(proxy)</span>
              )}
            </span>
            <span className="text-muted-foreground/50">|</span>
            <span>
              Prices: 
              <span className="text-success ml-1">UP {currentAlert.up_price.toFixed(2)}</span>
              <span className="mx-1">|</span>
              <span className="text-destructive">DOWN {currentAlert.down_price.toFixed(2)}</span>
            </span>
          </div>

          {/* Line 3: Signals: CVD↓ (1m) + FR↓ (1m)   Score: 8/10 */}
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Signals: <span className="text-foreground">{getSignalSummary(currentAlert.signals)}</span></span>
            <span className="text-muted-foreground/50">|</span>
            <span>Score: <span className="text-primary font-semibold">{currentAlert.score}/10</span></span>
          </div>

          {/* Line 4: Liquidity: Spread 0.02 OK   Size: $1,250/$1,180 */}
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>
              Liquidity: Spread {currentAlert.liquidity.spread.toFixed(3)} 
              <span className={currentAlert.liquidity.spread_ok ? 'text-success ml-1' : 'text-warning ml-1'}>
                {currentAlert.liquidity.spread_ok ? 'OK' : 'WIDE'}
              </span>
            </span>
            {(currentAlert.liquidity.best_bid_size_usd || currentAlert.liquidity.best_ask_size_usd) && (
              <>
                <span className="text-muted-foreground/50">|</span>
                <span>
                  Size: ${currentAlert.liquidity.best_bid_size_usd?.toLocaleString() ?? '-'}/
                  ${currentAlert.liquidity.best_ask_size_usd?.toLocaleString() ?? '-'}
                </span>
              </>
            )}
          </div>

          {/* Line 5: Actions */}
          <div className="flex items-center gap-2 pt-3 flex-wrap border-t border-border mt-3">
            <Button
              size="sm"
              variant={currentAlert.recommended_side === 'BUY_UP' ? 'default' : 'outline'}
              className={currentAlert.recommended_side === 'BUY_UP' ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}
              disabled={buyDisabled}
              onClick={() => handleAction('BUY_UP')}
            >
              {loadingAction === 'BUY_UP' ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <TrendingUp className="h-3 w-3 mr-1" />
              )}
              Buy UP
              {currentAlert.recommended_side === 'BUY_UP' && ' ★'}
            </Button>

            <Button
              size="sm"
              variant={currentAlert.recommended_side === 'BUY_DOWN' ? 'default' : 'outline'}
              className={currentAlert.recommended_side === 'BUY_DOWN' ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}
              disabled={buyDisabled}
              onClick={() => handleAction('BUY_DOWN')}
            >
              {loadingAction === 'BUY_DOWN' ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              Buy DOWN
              {currentAlert.recommended_side === 'BUY_DOWN' && ' ★'}
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
          </div>

          {isEntryBlocked && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>Entry blocked (&lt; 5:00 remaining)</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
