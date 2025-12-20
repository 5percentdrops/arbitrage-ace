import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Zap, Target, Clock } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DumpHedgeState, DumpHedgeParams, DumpHedgeCycleState } from '@/types/trading';
import { formatDistanceToNow } from 'date-fns';

interface DumpHedgePanelProps {
  state: DumpHedgeState;
  onToggleAutoMode: () => void;
  onUpdateParams: (params: Partial<DumpHedgeParams>) => void;
  warnings: string[];
}

// Cycle state display config
const cycleStateConfig: Record<DumpHedgeCycleState, { label: string; color: string; bgColor: string }> = {
  waiting: { label: 'Waiting for Dump', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  leg1_executed: { label: 'Leg1 Executed', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  leg2_executed: { label: 'Leg2 Executed', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  settled: { label: 'Settled', color: 'text-success', bgColor: 'bg-success/20' },
};

export function DumpHedgePanel({ state, onToggleAutoMode, onUpdateParams, warnings }: DumpHedgePanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { enabled, params, currentCycle, cycleHistory } = state;

  const currentState = currentCycle?.status || 'waiting';
  const stateDisplay = cycleStateConfig[currentState];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Target className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium">Dump & Hedge Strategy</CardTitle>
                <Badge variant="outline" className="text-xs">Optional</Badge>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-muted-foreground">Auto</span>
                <Switch checked={enabled} onCheckedChange={onToggleAutoMode} />
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-2">
            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-1">
                {warnings.map((warning, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-warning bg-warning/10 px-2 py-1 rounded">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Current State Indicator */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <span className="text-xs text-muted-foreground">Current State</span>
              <Badge className={`${stateDisplay.bgColor} ${stateDisplay.color} border-0`}>
                {stateDisplay.label}
              </Badge>
            </div>

            {/* Parameters */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Parameters</h4>
              <div className="grid grid-cols-2 gap-3">
                <TooltipProvider>
                  <div className="space-y-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="shares" className="text-xs flex items-center gap-1 cursor-help">
                          <Zap className="h-3 w-3" />
                          Shares
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Number of shares per leg</p>
                      </TooltipContent>
                    </Tooltip>
                    <Input
                      id="shares"
                      type="number"
                      min={1}
                      value={params.shares}
                      onChange={(e) => onUpdateParams({ shares: Number(e.target.value) })}
                      disabled={enabled}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="sumTarget" className="text-xs flex items-center gap-1 cursor-help">
                          <Target className="h-3 w-3" />
                          Sum Target
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Leg1 + OppositeAsk must be ≤ this value</p>
                      </TooltipContent>
                    </Tooltip>
                    <Input
                      id="sumTarget"
                      type="number"
                      min={0.5}
                      max={1}
                      step={0.01}
                      value={params.sumTarget}
                      onChange={(e) => onUpdateParams({ sumTarget: Number(e.target.value) })}
                      disabled={enabled}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="moveThreshold" className="text-xs flex items-center gap-1 cursor-help">
                          Move %
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Price drop % to trigger Leg1</p>
                      </TooltipContent>
                    </Tooltip>
                    <Input
                      id="moveThreshold"
                      type="number"
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      value={params.moveThreshold}
                      onChange={(e) => onUpdateParams({ moveThreshold: Number(e.target.value) })}
                      disabled={enabled}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="windowMinutes" className="text-xs flex items-center gap-1 cursor-help">
                          <Clock className="h-3 w-3" />
                          Window (min)
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Observation window in minutes</p>
                      </TooltipContent>
                    </Tooltip>
                    <Input
                      id="windowMinutes"
                      type="number"
                      min={1}
                      max={60}
                      value={params.windowMinutes}
                      onChange={(e) => onUpdateParams({ windowMinutes: Number(e.target.value) })}
                      disabled={enabled}
                      className="h-8 text-sm"
                    />
                  </div>
                </TooltipProvider>
              </div>
            </div>

            {/* Current Cycle Details */}
            {currentCycle && (currentCycle.leg1 || currentCycle.leg2) && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Cycle</h4>
                <div className="space-y-2 p-3 rounded-lg bg-card border border-border">
                  {currentCycle.leg1 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-blue-400">Leg1</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono">{currentCycle.leg1.side} @ ${currentCycle.leg1.entryPrice.toFixed(2)}</span>
                        <span className="text-muted-foreground ml-2">({currentCycle.leg1.shares} shares)</span>
                      </div>
                    </div>
                  )}
                  {currentCycle.leg2 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-green-400">Leg2</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono">{currentCycle.leg2.side} @ ${currentCycle.leg2.entryPrice.toFixed(2)}</span>
                          <span className="text-muted-foreground ml-2">({currentCycle.leg2.shares} shares)</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground">Locked Profit</span>
                        <span className="text-lg font-bold text-success">
                          ${currentCycle.lockedProfit.toFixed(4)}
                          <span className="text-xs ml-1">({currentCycle.lockedProfitPercent.toFixed(2)}%)</span>
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Cycle History */}
            {cycleHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last 5 Cycles</h4>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs h-8">Leg1</TableHead>
                        <TableHead className="text-xs h-8">Leg2</TableHead>
                        <TableHead className="text-xs h-8 text-right">Profit</TableHead>
                        <TableHead className="text-xs h-8 text-right">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cycleHistory.map((cycle) => (
                        <TableRow key={cycle.id} className="hover:bg-muted/50">
                          <TableCell className="text-xs py-2">
                            {cycle.leg1 && (
                              <span className="text-blue-400">
                                {cycle.leg1.side} @ ${cycle.leg1.entryPrice.toFixed(2)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs py-2">
                            {cycle.leg2 && (
                              <span className="text-green-400">
                                {cycle.leg2.side} @ ${cycle.leg2.entryPrice.toFixed(2)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs py-2 text-right font-mono text-success">
                            ${cycle.lockedProfit.toFixed(4)}
                          </TableCell>
                          <TableCell className="text-xs py-2 text-right text-muted-foreground">
                            {cycle.completedAt
                              ? formatDistanceToNow(cycle.completedAt, { addSuffix: false })
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
