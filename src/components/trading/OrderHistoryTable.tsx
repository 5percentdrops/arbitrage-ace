import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { OrderHistory } from '@/types/trading';
import { formatCurrency } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { History, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface OrderHistoryTableProps {
  orders: OrderHistory[];
  isLoading: boolean;
  lastRefresh: Date | null;
}

type SortField = 'ticker' | 'entryPrice' | 'pnl' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export function OrderHistoryTable({ orders, isLoading, lastRefresh }: OrderHistoryTableProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'ticker':
          comparison = a.ticker.localeCompare(b.ticker);
          break;
        case 'entryPrice':
          comparison = a.entryPrice - b.entryPrice;
          break;
        case 'pnl':
          comparison = a.pnl - b.pnl;
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [orders, sortField, sortDirection]);

  const SortableHeader = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead 
      className={cn("cursor-pointer hover:bg-muted/50 select-none transition-colors", className)}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
                <SortableHeader field="ticker" className="w-20">Ticker</SortableHeader>
                <TableHead className="text-xs text-muted-foreground font-medium">Timeframe</TableHead>
                <SortableHeader field="entryPrice" className="text-right">Entry Price</SortableHeader>
                <SortableHeader field="pnl" className="text-right">PnL</SortableHeader>
                <SortableHeader field="createdAt">Date</SortableHeader>
                <TableHead className="text-xs text-muted-foreground font-medium">Time</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Exit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No order history available
                  </TableCell>
                </TableRow>
              ) : (
                sortedOrders.slice(0, 10).map((order) => (
                  <TableRow 
                    key={order.id} 
                    className="text-xs font-mono"
                  >
                    <TableCell className="font-semibold">{order.ticker}</TableCell>
                    <TableCell>
                      <Badge className="text-xs bg-warning/20 text-warning">
                        15M
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(order.entryPrice)}</TableCell>
                    <TableCell className={cn(
                      "text-right text-xs font-mono font-medium",
                      order.pnl >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {order.pnl >= 0 ? '+' : ''}{formatCurrency(order.pnl)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={order.exitStrategy === 'threshold' ? 'default' : 'secondary'} className="text-xs">
                        {order.exitStrategy === 'threshold' ? 'Sell @ Threshold' : 'Hold to Settlement'}
                      </Badge>
                    </TableCell>
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