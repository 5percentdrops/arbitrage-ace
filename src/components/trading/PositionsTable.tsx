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
import { Briefcase, X, Clock, Loader2 } from 'lucide-react';
import { OpenPosition } from '@/types/trading';
import { formatNumber, formatCurrency, formatTimeRemaining } from '@/lib/mockData';
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
                <TableHead className="text-xs text-muted-foreground font-medium">Market</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Asset</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">YES</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">NO</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Combined</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Shares</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Locked</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Exit</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Time</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">PnL</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                    No open positions
                  </TableCell>
                </TableRow>
              ) : (
                positions.map((position) => {
                  const combinedPrice = position.yesEntryPrice + position.noEntryPrice;
                  return (
                    <TableRow
                      key={position.id}
                      className="border-border/20 hover:bg-muted/30"
                    >
                      <TableCell className="font-medium text-xs max-w-[150px] truncate">
                        {position.marketName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">
                          {position.token}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono text-green-400">
                        ${position.yesEntryPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono text-red-400">
                        ${position.noEntryPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono text-primary">
                        ${combinedPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        {position.shares}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        {formatCurrency(position.lockedCapital)}
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
                      <TableCell className="text-right text-xs">
                        <span className="flex items-center justify-end gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimeRemaining(position.timeRemaining)}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right text-xs font-mono font-medium",
                          position.unrealizedPnl >= 0 ? "text-green-400" : "text-red-400"
                        )}
                      >
                        {position.unrealizedPnl >= 0 ? '+' : ''}
                        {formatCurrency(position.unrealizedPnl)}
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
