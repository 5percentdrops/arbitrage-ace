import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { OrderHistory } from '@/types/trading';
import { formatCurrency, formatNumber } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { History, RefreshCw } from 'lucide-react';

interface OrderHistoryTableProps {
  orders: OrderHistory[];
  isLoading: boolean;
  lastRefresh: Date | null;
}

export function OrderHistoryTable({ orders, isLoading, lastRefresh }: OrderHistoryTableProps) {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      filled: 'bg-success/20 text-success',
      partial: 'bg-warning/20 text-warning',
      pending: 'bg-primary/20 text-primary',
      cancelled: 'bg-destructive/20 text-destructive',
    };
    return <Badge className={cn("text-xs", styles[status])}>{status}</Badge>;
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Order History
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
            {lastRefresh && <span>Updated {lastRefresh.toLocaleTimeString()}</span>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="w-20">Asset</TableHead>
                <TableHead>Ticker</TableHead>
                <TableHead className="text-right">L1 Shares</TableHead>
                <TableHead className="text-right">L2 Shares</TableHead>
                <TableHead className="text-right">L1 Locked</TableHead>
                <TableHead className="text-center">L1 Filled</TableHead>
                <TableHead className="text-center">L2 Filled</TableHead>
                <TableHead className="text-right">PnL</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No order history available
                  </TableCell>
                </TableRow>
              ) : (
                orders.slice(0, 10).map((order) => (
                  <TableRow 
                    key={order.id} 
                    className="text-xs font-mono"
                  >
                    <TableCell className="font-semibold">{order.token}</TableCell>
                    <TableCell className="font-sans">{order.ticker}</TableCell>
                    <TableCell className="text-right">{formatNumber(order.leg1Shares)}</TableCell>
                    <TableCell className="text-right">{formatNumber(order.leg2Shares)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(order.leg1Locked)}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-xs",
                        order.leg1Filled ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        {order.leg1Filled ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-xs",
                        order.leg2Filled ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        {order.leg2Filled ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right text-xs font-mono font-medium",
                      order.pnl >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {order.pnl >= 0 ? '+' : ''}{formatCurrency(order.pnl)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
