import { ListOrdered, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ActiveLadderOrder } from '@/types/auto-trading';

interface LimitOrdersTableProps {
  orders: ActiveLadderOrder[];
  onCancelAll: () => void;
  onCancelOrder?: (orderId: string) => void;
  isCancelling: boolean;
}

export function LimitOrdersTable({
  orders,
  onCancelAll,
  onCancelOrder,
  isCancelling,
}: LimitOrdersTableProps) {
  const hasOrders = orders.length > 0;
  const totalFilled = orders.reduce((acc, o) => acc + o.filledShares, 0);
  const totalShares = orders.reduce((acc, o) => acc + o.shares, 0);
  const overallFillPct = totalShares > 0 ? (totalFilled / totalShares) * 100 : 0;
  const totalArbAmount = orders.reduce((acc, o) => acc + o.arbAmount, 0);

  if (!hasOrders) {
    return (
      <Card className="border-border bg-card/80 backdrop-blur-sm">
        <CardContent className="py-6 text-center">
          <ListOrdered className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No active limit orders</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Click a profitable row to deploy orders</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Limit Orders</CardTitle>
            <Badge variant="outline" className="text-xs">
              {orders.length} orders
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onCancelAll}
            disabled={isCancelling}
          >
            <X className="h-3 w-3 mr-1" />
            {isCancelling ? 'Cancelling...' : 'Cancel All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Summary Row */}
        <div className="flex items-center justify-between text-xs mb-3 px-1">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Fill: <span className="font-mono">{overallFillPct.toFixed(0)}%</span>
            </span>
            <span className="text-muted-foreground">
              Total Shares: <span className="font-mono">{totalShares}</span>
            </span>
          </div>
          <span className="text-success font-medium">
            Est. Profit: <span className="font-mono">${totalArbAmount.toFixed(2)}</span>
          </span>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="h-8 text-xs font-medium w-12">Tier</TableHead>
                <TableHead className="h-8 text-xs font-medium w-14">Side</TableHead>
                <TableHead className="h-8 text-xs font-medium w-24">Filled</TableHead>
                <TableHead className="h-8 text-xs font-medium text-right w-16">Shares</TableHead>
                <TableHead className="h-8 text-xs font-medium text-right w-16">Price</TableHead>
                <TableHead className="h-8 text-xs font-medium text-right w-20">Arb Amt</TableHead>
                {onCancelOrder && (
                  <TableHead className="h-8 text-xs font-medium w-10"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className={cn(
                    "hover:bg-muted/30",
                    order.status === 'filled' && "opacity-60"
                  )}
                >
                  <TableCell className="py-1.5 px-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 font-mono"
                    >
                      L{order.ladderIndex}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1.5 px-2">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        order.side === 'YES'
                          ? "text-[hsl(var(--poly-yes))]"
                          : "text-[hsl(var(--poly-no))]"
                      )}
                    >
                      {order.side}
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5 px-2">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={order.fillPercent}
                        className="h-1.5 w-12"
                      />
                      <span className="text-xs font-mono text-muted-foreground w-8">
                        {order.fillPercent.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-right">
                    <span className="text-xs font-mono">{order.shares}</span>
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-right">
                    <span className="text-xs font-mono">
                      {Math.round(order.price * 100)}¢
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-right">
                    <span className="text-xs font-mono text-success">
                      ${order.arbAmount.toFixed(2)}
                    </span>
                  </TableCell>
                  {onCancelOrder && (
                    <TableCell className="py-1.5 px-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => onCancelOrder(order.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
