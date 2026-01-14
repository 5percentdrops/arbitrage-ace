import { Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TOKENS, type TokenSymbol } from '@/types/trading';
import { cn } from '@/lib/utils';

interface RoundTimerCardProps {
  roundStart: Date;
  roundEnd: Date;
  secondsRemaining: number;
  progressPercent: number;
  isJustStarted: boolean;
  syncStatus: 'synced' | 'client-side' | 'error';
  asset: TokenSymbol;
  onAssetChange: (asset: TokenSymbol) => void;
  onRefresh: () => void;
}

function formatTime(date: Date): string {
  return date.toISOString().slice(11, 19) + ' UTC';
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function RoundTimerCard({
  roundStart,
  roundEnd,
  secondsRemaining,
  progressPercent,
  isJustStarted,
  syncStatus,
  asset,
  onAssetChange,
  onRefresh,
}: RoundTimerCardProps) {
  return (
    <Card className={cn(
      "border-border bg-card transition-all duration-300",
      isJustStarted && "ring-2 ring-primary/50 animate-pulse"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Round Status</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={asset} onValueChange={(v) => onAssetChange(v as TokenSymbol)}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKENS.map((token) => (
                  <SelectItem key={token} value={token}>
                    {token}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Round times */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Round Start</p>
            <p className="font-mono font-medium">{formatTime(roundStart)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Round End</p>
            <p className="font-mono font-medium">{formatTime(roundEnd)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress 
            value={progressPercent} 
            className={cn(
              "h-2 bg-muted",
              secondsRemaining <= 300 && "[&>div]:bg-destructive"
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(progressPercent)}% elapsed</span>
            <span>{Math.round(100 - progressPercent)}% remaining</span>
          </div>
        </div>

        {/* Large countdown */}
        <div className="text-center py-4">
          <div className={cn(
            "text-4xl font-mono font-bold tracking-wider",
            secondsRemaining <= 300 ? "text-destructive animate-pulse" : "text-foreground",
            isJustStarted && "text-primary"
          )}>
            {formatCountdown(secondsRemaining)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isJustStarted ? '🟢 Round Just Started' : 'Time Remaining'}
          </p>
        </div>

        {/* Next round info */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-sm">
            <span className="text-muted-foreground">Next Round: </span>
            <span className="font-mono">{formatTime(roundEnd)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {syncStatus === 'synced' ? (
              <>
                <Wifi className="h-3 w-3 text-success" />
                <span className="text-success">Synced</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Local</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
