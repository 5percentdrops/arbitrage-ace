import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Square, 
  Loader2, 
  Activity,
  DollarSign,
  Clock,
  BarChart3
} from 'lucide-react';
import { BotStatus, PreflightCheck } from '@/types/trading';
import { formatCurrency } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { EmergencyStop } from './EmergencyStop';
import { PreflightChecks } from './PreflightChecks';

interface BotControlPanelProps {
  status: BotStatus;
  availableCapital: number;
  lockedCapital: number;
  activeMarkets: number;
  lastTradeAt: Date | null;
  compoundingEnabled: boolean;
  preflightChecks: PreflightCheck[];
  canStart: boolean;
  onStart: () => void;
  onStop: () => void;
  onEmergencyStop: () => void;
  onToggleCompounding: (enabled: boolean) => void;
}

export function BotControlPanel({
  status,
  availableCapital,
  lockedCapital,
  activeMarkets,
  lastTradeAt,
  compoundingEnabled,
  preflightChecks,
  canStart,
  onStart,
  onStop,
  onEmergencyStop,
  onToggleCompounding,
}: BotControlPanelProps) {
  const isRunning = status === 'running';
  const isTransitioning = status === 'starting' || status === 'stopping';

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return (
          <Badge className="bg-success/20 text-success border-success/30 gap-1 glow-success">
            <Activity className="h-3 w-3 animate-pulse" />
            Running
          </Badge>
        );
      case 'starting':
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Starting
          </Badge>
        );
      case 'stopping':
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Stopping
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Square className="h-3 w-3" />
            Stopped
          </Badge>
        );
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Bot Control
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Control Button */}
        <div className="flex gap-2">
          <Button
            size="lg"
            onClick={isRunning ? onStop : onStart}
            disabled={isTransitioning || (!isRunning && !canStart)}
            className={cn(
              "flex-1 h-14 text-base font-semibold transition-all duration-300",
              isRunning 
                ? "bg-destructive hover:bg-destructive/90" 
                : "bg-success hover:bg-success/90"
            )}
          >
            {isTransitioning ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : isRunning ? (
              <Square className="h-5 w-5 mr-2" />
            ) : (
              <Play className="h-5 w-5 mr-2" />
            )}
            {isTransitioning 
              ? (status === 'starting' ? 'Starting...' : 'Stopping...') 
              : (isRunning ? 'Stop Bot' : 'Start Bot')
            }
          </Button>
          
          {isRunning && (
            <EmergencyStop onEmergencyStop={onEmergencyStop} />
          )}
        </div>

        {/* Preflight Checks */}
        {!isRunning && (
          <PreflightChecks checks={preflightChecks} />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Available</span>
            </div>
            <p className="font-mono text-lg font-semibold text-success">
              {formatCurrency(availableCapital)}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Locked</span>
            </div>
            <p className="font-mono text-lg font-semibold text-warning">
              {formatCurrency(lockedCapital)}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Active Markets</span>
            </div>
            <p className="font-mono text-lg font-semibold">
              {activeMarkets}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Last Trade</span>
            </div>
            <p className="font-mono text-sm font-semibold">
              {lastTradeAt ? lastTradeAt.toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>

        {/* Auto Compounding Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
          <div>
            <p className="text-sm font-medium">Auto Compounding</p>
            <p className="text-xs text-muted-foreground">Reinvest profits automatically</p>
          </div>
          <Switch
            checked={compoundingEnabled}
            onCheckedChange={onToggleCompounding}
          />
        </div>
      </CardContent>
    </Card>
  );
}
