import { BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
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

function formatPrice(price: number | undefined): string {
  if (price === undefined || price === null) return '—';
  return price.toFixed(3);
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
  const spread = snapshot 
    ? ((snapshot.yesAsk - snapshot.yesBid) + (snapshot.noAsk - snapshot.noBid)) / 2
    : null;
  
  const combined = snapshot 
    ? snapshot.yesAsk + snapshot.noAsk
    : null;

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
        {error ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : isLoading && !snapshot ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
          </div>
        ) : snapshot ? (
          <div className="space-y-4">
            {/* Bid/Ask Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* YES Column */}
              <div className="space-y-2">
                <div className="text-center">
                  <span className="text-xs font-medium text-success uppercase tracking-wide">
                    YES
                  </span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bid</span>
                    <span className="font-mono font-medium">{formatPrice(snapshot.yesBid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ask</span>
                    <span className="font-mono font-medium text-success">{formatPrice(snapshot.yesAsk)}</span>
                  </div>
                </div>
              </div>

              {/* NO Column */}
              <div className="space-y-2">
                <div className="text-center">
                  <span className="text-xs font-medium text-destructive uppercase tracking-wide">
                    NO
                  </span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bid</span>
                    <span className="font-mono font-medium">{formatPrice(snapshot.noBid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ask</span>
                    <span className="font-mono font-medium text-destructive">{formatPrice(snapshot.noAsk)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Combined stats */}
            <div className="flex justify-between items-center pt-2 border-t border-border text-sm">
              <span className="text-muted-foreground">Combined (YES + NO Ask)</span>
              <span className="font-mono font-medium">
                {combined ? combined.toFixed(3) : '—'}
                {spread !== null && (
                  <span className="text-muted-foreground ml-2">
                    ({(spread * 100).toFixed(1)}% spread)
                  </span>
                )}
              </span>
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
