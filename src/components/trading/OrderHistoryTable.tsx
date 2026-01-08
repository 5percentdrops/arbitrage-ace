import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { OrderHistory } from '@/types/trading';
import { formatCurrency, formatNumber } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { History, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface OrderHistoryTableProps {
  orders: OrderHistory[];
  isLoading: boolean;
  lastRefresh: Date | null;
}

type SortField = 'token' | 'leg1Shares' | 'leg2Shares' | 'combined' | 'leg1Locked' | 'pnl' | 'status' | 'createdAt';
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
        case 'token':
          comparison = a.token.localeCompare(b.token);
          break;
        case 'leg1Shares':
          comparison = a.leg1Shares - b.leg1Shares;
          break;
        case 'leg2Shares':
          comparison = a.leg2Shares - b.leg2Shares;
          break;
        case 'combined':
          comparison = (a.leg1Shares + a.leg2Shares) - (b.leg1Shares + b.leg2Shares);
          break;
        case 'leg1Locked':
          comparison = a.leg1Locked - b.leg1Locked;
          break;
        case 'pnl':
          comparison = a.pnl - b.pnl;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      filled: 'bg-success/20 text-success',
      partial: 'bg-warning/20 text-warning',
      pending: 'bg-primary/20 text-primary',
      cancelled: 'bg-destructive/20 text-destructive',
    };
    return <Badge className={cn("text-xs", styles[status])}>{status}</Badge>;
  };

  const formatDateTime = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
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
                <SortableHeader field="token" className="w-20">Asset</SortableHeader>
                <SortableHeader field="leg1Shares" className="text-right">L1 Shares</SortableHeader>
                <SortableHeader field="leg2Shares" className="text-right">L2 Shares</SortableHeader>
                <SortableHeader field="combined" className="text-right">Combined</SortableHeader>
                <SortableHeader field="leg1Locked" className="text-right">L1 Locked</SortableHeader>
                <TableHead className="text-center">L1 Filled</TableHead>
                <TableHead className="text-center">L2 Filled</TableHead>
                <SortableHeader field="pnl" className="text-right">PnL</SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <SortableHeader field="createdAt">Date/Time</SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No order history available
                  </TableCell>
                </TableRow>
              ) : (
                sortedOrders.slice(0, 10).map((order) => (
                  <TableRow 
                    key={order.id} 
                    className="text-xs font-mono"
                  >
                    <TableCell className="font-semibold">{order.token}</TableCell>
                    <TableCell className="text-right">{formatNumber(order.leg1Shares)}</TableCell>
                    <TableCell className="text-right">{formatNumber(order.leg2Shares)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{formatNumber(order.leg1Shares + order.leg2Shares)}</TableCell>
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
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(order.createdAt)}
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
