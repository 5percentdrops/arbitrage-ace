import { BarChart3, RefreshCw, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { MarketSnapshot } from '@/types/manual-trading';
import type { TokenSymbol } from '@/types/trading';

interface MarketSnapshotCardProps {
  asset: TokenSymbol;
  snapshot: MarketSnapshot | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

function formatTimeAgo(date: Date | null): string {
  if (!date) return 'never';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

export function MarketSnapshotCard({
  asset,
  snapshot,
  isLoading,
  error,
  lastUpdated,
  onRefresh,
}: MarketSnapshotCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Market Snapshot ({asset})
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(lastUpdated)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && !snapshot ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
          </div>
        ) : snapshot ? (
          <div className="grid grid-cols-2 gap-6">
            {/* UP Column */}
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm font-bold text-success uppercase tracking-wide">UP</span>
              </div>
              <div className="text-3xl font-mono font-bold">
                {Math.round(snapshot.yesAsk * 100)}¢
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(snapshot.yesAsk * 100)}% chance
              </div>
            </div>

            {/* DOWN Column */}
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-destructive uppercase tracking-wide">DOWN</span>
                <X className="h-4 w-4 text-destructive" />
              </div>
              <div className="text-3xl font-mono font-bold">
                {Math.round(snapshot.noAsk * 100)}¢
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(snapshot.noAsk * 100)}% chance
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No market data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
