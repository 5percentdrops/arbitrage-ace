import { useState, useCallback, useMemo } from 'react';
import { AlertTriangle, RefreshCw, Zap, TrendingUp, Filter, Pause, Play, DollarSign, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAutoOrderBook } from '@/hooks/useAutoOrderBook';
import { SpreadCalculator } from './SpreadCalculator';
import { AutoOrdersPanel } from './AutoOrdersPanel';
import { LadderRow } from './LadderRow';
import type { LadderSelection, ActiveLadderOrder, LevelEdgeInfo } from '@/types/auto-trading';
import type { TokenSymbol } from '@/types/trading';

// Tiered distribution - L1 (best edge) gets most, L7 gets least
const TIER_WEIGHTS = [0.25, 0.18, 0.15, 0.13, 0.11, 0.10, 0.08]; // = 1.00

function calculateTieredShares(totalSize: number, numLevels: number): number[] {
  const weights = TIER_WEIGHTS.slice(0, numLevels);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => Math.floor((w / totalWeight) * totalSize));
}

interface AutoLadderProps {
  asset: TokenSymbol;
  marketId: string;
}

export function AutoLadder({ asset, marketId }: AutoLadderProps) {
  const [size, setSize] = useState(10);
  const [positionSize, setPositionSize] = useState(1000);
  const [minNetEdgePct, setMinNetEdgePct] = useState(0.5);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [deployedOrders, setDeployedOrders] = useState<ActiveLadderOrder[]>([]);
  const [showProfitableOnly, setShowProfitableOnly] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [previewPrices, setPreviewPrices] = useState<Map<number, { tier: number; allocation: number }>>(new Map());

  const {
    orderBook,
    isLoading,
    error,
    yesSelection,
    noSelection,
    setYesSelection,
    setNoSelection,
    clearSelections,
    suggestedCounterpart,
    currentEdge,
    profitableLevels,
    levelEdges,
    isOutOfRange,
    rangeMin,
    rangeMax,
    refresh,
  } = useAutoOrderBook({ marketId, minNetEdgePct, isPaused });

  // Handle YES cell click
  const handleYesClick = useCallback((price: number, type: 'bid' | 'ask') => {
    const selection: LadderSelection = { side: 'YES', price, type };
    setYesSelection(selection);
  }, [setYesSelection]);

  // Handle NO cell click
  const handleNoClick = useCallback((price: number, type: 'bid' | 'ask') => {
    const noPrice = 1 - price;
    const selection: LadderSelection = { side: 'NO', price: noPrice, type };
    setNoSelection(selection);
  }, [setNoSelection]);

  // Deploy ladder orders
  const handleDeployLadder = useCallback(async () => {
    if (!currentEdge) return;
    
    setIsDeploying(true);
    try {
      // Simulate API call - in production, call deployLadder()
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock deployed orders
      const mockOrders: ActiveLadderOrder[] = Array.from({ length: 7 }, (_, i) => ({
        id: `order-${Date.now()}-${i}`,
        ladderIndex: i + 1,
        side: i % 2 === 0 ? 'YES' : 'NO',
        price: currentEdge.yesPrice + (i - 3) * 0.01,
        shares: Math.floor(size * (1 - i * 0.1)),
        filledShares: 0,
        fillPercent: 0,
        status: 'pending',
      }));
      
      setDeployedOrders(mockOrders);
    } finally {
      setIsDeploying(false);
    }
  }, [currentEdge, size]);

  // Cancel all orders
  const handleCancelAll = useCallback(async () => {
    setIsCancelling(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setDeployedOrders([]);
      clearSelections();
    } finally {
      setIsCancelling(false);
    }
  }, [clearSelections]);

  // Filter levels within range and optionally by profitability
  const visibleLevels = useMemo(() => {
    if (!orderBook) return [];
    return orderBook.levels.filter(level => {
      const inRange = level.price >= rangeMin && level.price <= rangeMax;
      if (!inRange) return false;
      if (showProfitableOnly) {
        return profitableLevels.has(level.price);
      }
      return true;
    });
  }, [orderBook, rangeMin, rangeMax, showProfitableOnly, profitableLevels]);

  // Find midpoint level
  const midpointPrice = orderBook?.refPrice ?? 0.5;

  // Find best arbitrage opportunity
  const bestArb = useMemo(() => {
    if (levelEdges.size === 0) return null;
    
    let best: { price: number; edge: LevelEdgeInfo } | null = null;
    levelEdges.forEach((edge, price) => {
      if (edge.isProfitable) {
        if (!best || edge.netEdgePct > best.edge.netEdgePct) {
          best = { price, edge };
        }
      }
    });
    return best;
  }, [levelEdges]);

  const hasSelection = yesSelection !== null || noSelection !== null;

  // Calculate top 7 profitable levels for preview
  const getTop7Profitable = useCallback(() => {
    return Array.from(levelEdges.entries())
      .filter(([_, edge]) => edge.isProfitable)
      .sort((a, b) => b[1].netEdgePct - a[1].netEdgePct)
      .slice(0, 7);
  }, [levelEdges]);

  // Handle row hover - show preview of 7-row selection with tiered allocation
  const handleRowHover = useCallback((price: number, isHovering: boolean) => {
    if (!isHovering || !levelEdges.get(price)?.isProfitable) {
      setPreviewPrices(new Map());
      return;
    }
    
    const top7 = getTop7Profitable();
    const tierShares = calculateTieredShares(positionSize, top7.length);
    
    const previewMap = new Map<number, { tier: number; allocation: number }>();
    top7.forEach(([p], index) => {
      previewMap.set(p, { tier: index + 1, allocation: tierShares[index] });
    });
    
    setPreviewPrices(previewMap);
  }, [levelEdges, positionSize, getTop7Profitable]);

  // Handle click on profitable arbitrage level - auto deploy ladder with tiered sizing
  const handleArbLevelClick = useCallback(async (clickedPrice: number) => {
    // Only proceed if this level is profitable
    const clickedEdge = levelEdges.get(clickedPrice);
    if (!clickedEdge?.isProfitable) return;
    
    setIsDeploying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get top 7 profitable levels, sorted by edge (best first)
      const profitableLevelsSorted = getTop7Profitable();
      
      if (profitableLevelsSorted.length === 0) return;
      
      // Calculate tiered shares allocation
      const tierShares = calculateTieredShares(positionSize, profitableLevelsSorted.length);
      
      // Generate paired orders for each profitable level with tiered sizing
      const newOrders: ActiveLadderOrder[] = profitableLevelsSorted.flatMap(([price, edge], index) => ([
        {
          id: `order-${Date.now()}-yes-${index}`,
          ladderIndex: index + 1,
          side: 'YES' as const,
          price: price,
          shares: tierShares[index],
          filledShares: 0,
          fillPercent: 0,
          status: 'pending' as const,
        },
        {
          id: `order-${Date.now()}-no-${index}`,
          ladderIndex: index + 1,
          side: 'NO' as const,
          price: 1 - price,
          shares: tierShares[index],
          filledShares: 0,
          fillPercent: 0,
          status: 'pending' as const,
        },
      ]));
      
      setDeployedOrders(prev => [...prev, ...newOrders]);
      setPreviewPrices(new Map());
      
      const totalDeployed = tierShares.reduce((a, b) => a + b, 0);
      toast({
        title: "Tiered Ladder Deployed",
        description: `Deployed $${totalDeployed} across ${profitableLevelsSorted.length} arb levels (L1: $${tierShares[0]} → L${profitableLevelsSorted.length}: $${tierShares[profitableLevelsSorted.length - 1]})`,
      });
    } finally {
      setIsDeploying(false);
    }
  }, [levelEdges, positionSize, getTop7Profitable]);

  // Quick deploy best arb with tiered sizing
  const handleQuickDeploy = useCallback(async () => {
    if (!bestArb) return;
    
    setIsDeploying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const profitableLevelsSorted = getTop7Profitable();
      if (profitableLevelsSorted.length === 0) return;
      
      const tierShares = calculateTieredShares(positionSize, profitableLevelsSorted.length);
      
      const newOrders: ActiveLadderOrder[] = profitableLevelsSorted.flatMap(([price], index) => ([
        {
          id: `order-${Date.now()}-yes-${index}`,
          ladderIndex: index + 1,
          side: 'YES' as const,
          price: price,
          shares: tierShares[index],
          filledShares: 0,
          fillPercent: 0,
          status: 'pending' as const,
        },
        {
          id: `order-${Date.now()}-no-${index}`,
          ladderIndex: index + 1,
          side: 'NO' as const,
          price: 1 - price,
          shares: tierShares[index],
          filledShares: 0,
          fillPercent: 0,
          status: 'pending' as const,
        },
      ]));
      
      setDeployedOrders(prev => [...prev, ...newOrders]);
      
      toast({
        title: "Tiered Ladder Deployed",
        description: `Deployed $${positionSize} across ${profitableLevelsSorted.length} arb levels`,
      });
    } finally {
      setIsDeploying(false);
    }
  }, [bestArb, positionSize, getTop7Profitable]);

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-20 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading order book...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-10">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Out of Range Warning */}
      {isOutOfRange && (
        <Alert variant="destructive" className="bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Price moved outside ±3% range. Consider cancelling orders.</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelAll}
              disabled={isCancelling}
            >
              Cancel All
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Right Side Panel - shown first on mobile for visibility */}
        <div className="xl:hidden space-y-4">
          <SpreadCalculator
            edge={currentEdge}
            size={size}
            onSizeChange={setSize}
            minNetEdgePct={minNetEdgePct}
            onMinEdgeChange={setMinNetEdgePct}
            autoTradeEnabled={autoTradeEnabled}
            onAutoTradeToggle={setAutoTradeEnabled}
            onDeployLadder={handleDeployLadder}
            isDeploying={isDeploying}
            hasSelection={hasSelection}
          />
        </div>

        {/* Main Ladder */}
        <Card className="xl:col-span-3 border-border bg-card overflow-hidden">
          <CardHeader className="pb-2 flex-row flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">{asset} Order Book Ladder</CardTitle>
              <span className="text-xs text-muted-foreground font-mono">
                Tick: {orderBook?.tick ?? 0.01} | Range: {(rangeMin).toFixed(2)} - {(rangeMax).toFixed(2)}
              </span>
              {/* Pause/Refresh buttons immediately after title for visibility */}
              <div className="flex items-center gap-1">
                <Button
                  variant={isPaused ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setIsPaused(!isPaused)}
                  className={cn(
                    "h-8 gap-1.5",
                    isPaused && "bg-warning text-warning-foreground hover:bg-warning/90"
                  )}
                >
                  {isPaused ? (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-3.5 w-3.5" />
                      Pause
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refresh}
                  className="h-8 w-8"
                  disabled={isPaused}
                >
                  <RefreshCw className={cn("h-4 w-4", !isPaused && "animate-none")} />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Position Size Input */}
              <div className="flex items-center gap-2 bg-muted/30 rounded-md px-2 py-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <Label htmlFor="position-size" className="text-xs text-muted-foreground whitespace-nowrap">
                  Position Size
                </Label>
                <Input
                  id="position-size"
                  type="number"
                  min={10}
                  step={100}
                  value={positionSize}
                  onChange={(e) => setPositionSize(Number(e.target.value))}
                  className="w-24 h-7 text-xs font-mono bg-background border-border"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="profitable-filter"
                  checked={showProfitableOnly}
                  onCheckedChange={setShowProfitableOnly}
                  className="data-[state=checked]:bg-success"
                />
                <Label 
                  htmlFor="profitable-filter" 
                  className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1.5"
                >
                  <Filter className="h-3 w-3" />
                  Arb Only
                </Label>
              </div>

              {/* Cancel Preview Button */}
              {previewPrices.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewPrices(new Map())}
                  className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear Preview
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Deployed Orders Banner */}
            {deployedOrders.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2 bg-warning/10 border-b border-warning/30">
                <span className="text-xs text-warning font-medium">
                  {deployedOrders.length} orders deployed
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelAll}
                  disabled={isCancelling}
                  className="h-6 gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5" />
                  {isCancelling ? 'Cancelling...' : 'Cancel All'}
                </Button>
              </div>
            )}

            {/* Best Arb Indicator */}
            {bestArb && (
              <div className="flex items-center justify-between px-4 py-3 bg-success/10 border-b border-success/30">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-success/20">
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-success">Best Arbitrage Found</div>
                    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                      <span>YES @ {bestArb.price.toFixed(2)}</span>
                      <span>+</span>
                      <span>NO @ {(1 - bestArb.price).toFixed(2)}</span>
                      <span>=</span>
                      <span className="text-success font-bold">+{bestArb.edge.netEdgePct.toFixed(2)}% edge</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleQuickDeploy}
                  disabled={isDeploying}
                  className="bg-success hover:bg-success/90 text-success-foreground gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5" />
                  {isDeploying ? 'Deploying...' : 'Quick Deploy'}
                </Button>
              </div>
            )}

            {/* Header Row */}
            <div className="grid grid-cols-9 text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border">
              <div className="py-2 px-2 text-center">Bid Size</div>
              <div className="py-2 px-2 text-center text-success">YES</div>
              <div className="py-2 px-2 text-center">Ask Size</div>
              <div className="col-span-3 py-2 px-2 text-center">
                <span className="mr-2">Cost</span>
                <span>Net Edge</span>
              </div>
              <div className="py-2 px-2 text-center">Bid Size</div>
              <div className="py-2 px-2 text-center text-destructive">NO</div>
              <div className="py-2 px-2 text-center">Ask Size</div>
            </div>

            {/* Ladder Rows */}
            <div className="max-h-[500px] overflow-y-auto">
              {visibleLevels.map((level) => {
                const isYesSelected = yesSelection?.price === level.price;
                const noPrice = 1 - level.price;
                const isNoSelected = noSelection?.price === noPrice;
                const isSelected = isYesSelected || isNoSelected;
                const isProfitable = profitableLevels.has(level.price);
                const isSuggested = 
                  (suggestedCounterpart?.side === 'YES' && suggestedCounterpart.price === level.price) ||
                  (suggestedCounterpart?.side === 'NO' && suggestedCounterpart.price === noPrice);
                const isMidpoint = Math.abs(level.price - midpointPrice) < 0.005;

                const previewData = previewPrices.get(level.price);

                return (
                  <LadderRow
                    key={level.price}
                    level={level}
                    edgeInfo={levelEdges.get(level.price) ?? null}
                    isSelected={isSelected}
                    isProfitable={isProfitable}
                    isSuggested={isSuggested}
                    isMidpoint={isMidpoint}
                    yesOrders={deployedOrders.filter(o => o.side === 'YES')}
                    noOrders={deployedOrders.filter(o => o.side === 'NO')}
                    onYesClick={(type) => handleYesClick(level.price, type)}
                    onNoClick={(type) => handleNoClick(level.price, type)}
                    onArbClick={() => handleArbLevelClick(level.price)}
                    onHover={(isHovering) => handleRowHover(level.price, isHovering)}
                    isInPreview={!!previewData}
                    previewTier={previewData?.tier}
                    tierAllocation={previewData?.allocation}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right Side Panel - hidden on mobile since shown above */}
        <div className="hidden xl:block space-y-4">
          <SpreadCalculator
            edge={currentEdge}
            size={size}
            onSizeChange={setSize}
            minNetEdgePct={minNetEdgePct}
            onMinEdgeChange={setMinNetEdgePct}
            autoTradeEnabled={autoTradeEnabled}
            onAutoTradeToggle={setAutoTradeEnabled}
            onDeployLadder={handleDeployLadder}
            isDeploying={isDeploying}
            hasSelection={hasSelection}
          />

          <AutoOrdersPanel
            orders={deployedOrders}
            onCancelAll={handleCancelAll}
            onRefresh={refresh}
            isCancelling={isCancelling}
          />
        </div>
      </div>
    </div>
  );
}
