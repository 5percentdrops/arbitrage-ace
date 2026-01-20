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
import { Briefcase, Loader2 } from 'lucide-react';
import { OpenPosition } from '@/types/trading';
import { formatCurrency } from '@/lib/mockData';
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
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
                <TableHead className="text-xs text-muted-foreground font-medium">Timeframe</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Entry Price</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">PnL</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Date</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Time</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Exit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
                      <span className="font-mono">{position.ticker}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className="text-xs bg-warning/20 text-warning">
                        15M
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {formatCurrency(position.entryPrice)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right text-xs font-mono font-medium",
                      position.pnl >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(position.openedAt)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(position.openedAt)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={position.exitStrategy === 'threshold' ? 'default' : 'secondary'} className="text-xs">
                        {position.exitStrategy === 'threshold' ? 'Sell @ Threshold' : 'Hold to Settlement'}
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