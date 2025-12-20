import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArbitrageOpportunity } from '@/types/trading';
import { formatCurrency, formatNumber, formatTimeRemaining } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { TrendingUp, RefreshCw } from 'lucide-react';

interface OpportunitiesTableProps {
  opportunities: (ArbitrageOpportunity & { isArbitrage?: boolean })[];
  isLoading: boolean;
  lastRefresh: Date | null;
}

export function OpportunitiesTable({ opportunities, isLoading, lastRefresh }: OpportunitiesTableProps) {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      detected: 'bg-primary/20 text-primary',
      executing: 'bg-warning/20 text-warning',
      open: 'bg-success/20 text-success',
      settled: 'bg-muted text-muted-foreground',
      missed: 'bg-destructive/20 text-destructive',
    };
    return <Badge className={cn("text-xs", styles[status])}>{status}</Badge>;
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Arbitrage Opportunities
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
                <TableHead className="w-16">Token</TableHead>
                <TableHead>Market</TableHead>
                <TableHead className="text-right">YES</TableHead>
                <TableHead className="text-right">NO</TableHead>
                <TableHead className="text-right">Spread%</TableHead>
                <TableHead className="text-right">Liq</TableHead>
                <TableHead className="text-right">Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No opportunities found matching filters
                  </TableCell>
                </TableRow>
              ) : (
                opportunities.slice(0, 10).map((opp) => (
                  <TableRow 
                    key={opp.id} 
                    className={cn(
                      "text-xs font-mono",
                      opp.isArbitrage && "bg-success/5 border-l-2 border-l-success"
                    )}
                  >
                    <TableCell className="font-semibold">{opp.token}</TableCell>
                    <TableCell className="max-w-[200px] truncate font-sans">{opp.marketName}</TableCell>
                    <TableCell className="text-right text-trading-buy">${opp.yesPrice.toFixed(3)}</TableCell>
                    <TableCell className="text-right text-trading-sell">${opp.noPrice.toFixed(3)}</TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold",
                      opp.spreadPercent > 2 ? "text-success" : "text-muted-foreground"
                    )}>
                      {opp.spreadPercent.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(opp.liquidity)}</TableCell>
                    <TableCell className="text-right">{formatTimeRemaining(opp.timeToSettlement)}</TableCell>
                    <TableCell>{getStatusBadge(opp.status)}</TableCell>
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
