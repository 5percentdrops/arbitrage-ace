import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, X, Loader2 } from 'lucide-react';
import { OpenPosition, MarketTimeframe, Leg2FillStatus } from '@/types/trading';
import { formatNumber, formatCurrency } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface PositionsTableProps {
  positions: OpenPosition[];
  onClosePosition: (positionId: string) => void;
  isLoading?: boolean;
}

export function PositionsTable({
  positions,
  onClosePosition,
  isLoading = false,
}: PositionsTableProps) {
  const getTimeframeBadge = (timeframe: MarketTimeframe) => {
    const labels: Record<MarketTimeframe, string> = {
      '15m': '15M',
      '1h': '1H',
      '4h': '4H',
      'daily': '1D',
    };
    const styles: Record<MarketTimeframe, string> = {
      '15m': 'bg-warning/20 text-warning',
      '1h': 'bg-primary/20 text-primary',
      '4h': 'bg-secondary text-foreground',
      'daily': 'bg-success/20 text-success',
    };
    return (
      <Badge className={cn('text-xs', styles[timeframe])}>
        {labels[timeframe]}
      </Badge>
    );
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            Open Positions
            {positions.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {positions.length}
              </Badge>
            )}
          </CardTitle>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/30">
                <TableHead className="text-xs text-muted-foreground font-medium">Ticker</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">L1 Shares</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">L2 Shares</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Combined</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">L1 Locked</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-center">L1 Filled</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-center">L2 Filled</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Exit</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Time</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    No open positions
                  </TableCell>
                </TableRow>
              ) : (
                positions.map((position) => (
                  <TableRow
                    key={position.id}
                    className="border-border/20 hover:bg-muted/30"
                  >
                    <TableCell className="font-medium text-xs">
                      <Badge variant="outline" className="text-xs font-mono">
                        {position.token}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {formatNumber(position.leg1Shares)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {formatNumber(position.leg2Shares)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono font-semibold text-primary">
                      {formatNumber(position.leg1Shares + position.leg2Shares)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {formatCurrency(position.leg1Locked)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-xs",
                        position.leg1Filled ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        {position.leg1Filled ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-xs",
                        position.leg2Filled === 'yes' 
                          ? "bg-success/20 text-success" 
                          : position.leg2Filled === 'pending'
                          ? "bg-warning/20 text-warning"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {position.leg2Filled === 'yes' ? 'Yes' : position.leg2Filled === 'pending' ? 'Pending' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          position.exitMode === 'hold_to_settlement'
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}
                      >
                        {position.exitMode === 'hold_to_settlement' ? 'Hold' : 'Threshold'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getTimeframeBadge(position.timeframe)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => onClosePosition(position.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
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
