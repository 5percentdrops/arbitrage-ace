import { forwardRef } from 'react';
import { ListOrdered, X, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ActiveLadderOrder } from '@/types/auto-trading';

interface AutoOrdersPanelProps {
  orders: ActiveLadderOrder[];
  onCancelAll: () => void;
  onRefresh: () => void;
  isCancelling: boolean;
}

export const AutoOrdersPanel = forwardRef<HTMLDivElement, AutoOrdersPanelProps>(
  function AutoOrdersPanel(
    { orders, onCancelAll, onRefresh, isCancelling },
    ref
  ) {
    const hasOrders = orders.length > 0;
    const totalFilled = orders.reduce((acc, o) => acc + o.filledShares, 0);
    const totalShares = orders.reduce((acc, o) => acc + o.shares, 0);
    const overallFillPct = totalShares > 0 ? (totalFilled / totalShares) * 100 : 0;

    return (
      <Card ref={ref} className="border-border bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Active Ladder Orders</CardTitle>
              {hasOrders && (
                <Badge variant="outline" className="text-xs">
                  {orders.length} orders
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRefresh}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              {hasOrders && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={onCancelAll}
                  disabled={isCancelling}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasOrders ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No active ladder orders
            </div>
          ) : (
            <div className="space-y-2">
              {/* Overall progress */}
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">Overall Fill</span>
                <span className="font-mono">
                  {totalFilled}/{totalShares} ({overallFillPct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${overallFillPct}%` }}
                />
              </div>

              {/* Order list */}
              <div className="space-y-1 mt-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded text-xs",
                      "bg-muted/30 hover:bg-muted/50 transition-colors",
                      order.status === 'filled' && "opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 font-mono",
                          order.side === 'YES' 
                            ? "border-success/50 text-success" 
                            : "border-destructive/50 text-destructive"
                        )}
                      >
                        L{order.ladderIndex}
                      </Badge>
                      <span className={cn(
                        "font-medium",
                        order.side === 'YES' ? "text-success" : "text-destructive"
                      )}>
                        {order.side}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span>{order.shares} sh</span>
                      <span>@{order.price.toFixed(2)}</span>
                      <Badge
                        variant={order.fillPercent === 100 ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {order.fillPercent.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
