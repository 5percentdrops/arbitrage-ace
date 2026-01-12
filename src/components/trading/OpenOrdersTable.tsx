import { ClipboardList, X, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { OpenOrder } from '@/types/manual-trading';
import type { TokenSymbol } from '@/types/trading';
import { cn } from '@/lib/utils';

interface OpenOrdersTableProps {
  asset: TokenSymbol;
  orders: OpenOrder[];
  isLoading: boolean;
  error: string | null;
  onCancelOrder: (orderId: string) => Promise<boolean>;
  onCancelAll: () => Promise<boolean>;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function OpenOrdersTable({
  asset,
  orders,
  isLoading,
  error,
  onCancelOrder,
  onCancelAll,
}: OpenOrdersTableProps) {
  const hasOrders = orders.length > 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Open Orders ({asset})
            </CardTitle>
            {hasOrders && (
              <Badge variant="secondary" className="text-xs">
                {orders.length}
              </Badge>
            )}
          </div>
          {hasOrders && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onCancelAll}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Cancel All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : isLoading && orders.length === 0 ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !hasOrders ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No open orders for {asset}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Outcome</TableHead>
                  <TableHead className="text-xs">Side</TableHead>
                  <TableHead className="text-xs text-right">Shares</TableHead>
                  <TableHead className="text-xs text-right">Price</TableHead>
                  <TableHead className="text-xs text-right">Filled</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-xs",
                          order.outcome === 'YES'
                            ? "border-success/50 text-success"
                            : "border-destructive/50 text-destructive"
                        )}
                      >
                        {order.outcome}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-medium text-xs",
                          order.side === 'BUY' ? "text-success" : "text-destructive"
                        )}
                      >
                        {order.side}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {order.shares}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {order.price.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {order.filledShares}/{order.shares}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === 'open'
                            ? 'secondary'
                            : order.status === 'partial'
                            ? 'default'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onCancelOrder(order.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
