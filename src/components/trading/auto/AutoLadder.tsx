import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AlertTriangle, RefreshCw, Zap, TrendingUp, Filter, Pause, Play, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAutoOrderBook } from '@/hooks/useAutoOrderBook';
import { SpreadCalculator } from './SpreadCalculator';
import { LimitOrdersTable } from './LimitOrdersTable';
import { BetAngelLadder } from './BetAngelLadder';
import { QuickStakeButtons } from './QuickStakeButtons';
import { SpreadIndicator } from './SpreadIndicator';
import type { LadderSelection, ActiveLadderOrder, LevelEdgeInfo, PairedArbSelection } from '@/types/auto-trading';
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
  const [positionSize, setPositionSize] = useState(250);
  const [minNetEdgePct, setMinNetEdgePct] = useState(0.5);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [deployedOrders, setDeployedOrders] = useState<ActiveLadderOrder[]>([]);
  const [showProfitableOnly, setShowProfitableOnly] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [previewPrices, setPreviewPrices] = useState<Map<number, { tier: number; allocation: number }>>(new Map());
  const [pairedSelection, setPairedSelection] = useState<PairedArbSelection | null>(null);
  
  // Ref to track previous profitable levels for auto-deploy
  const prevProfitableLevelsRef = useRef<string>('');

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

  // Handle cell click to deploy 7 tiered arb orders
  // Clicking on YES side auto-matches NO, clicking on NO side auto-matches YES
  const handleCellClick = useCallback((clickedLevelPrice: number, side: 'YES' | 'NO', type: 'bid' | 'ask') => {
    if (!orderBook) return;
    
    // Find the clicked level
    const clickedLevel = orderBook.levels.find(l => Math.abs(l.price - clickedLevelPrice) < 0.005);
    if (!clickedLevel) return;
    
    // Check if this level has an arb opportunity
    const totalCost = clickedLevel.yesAskPrice + clickedLevel.noAskPrice;
    if (totalCost >= 1.0) {
      toast({
        title: "No Arbitrage Available",
        description: `YES (${Math.round(clickedLevel.yesAskPrice * 100)}¢) + NO (${Math.round(clickedLevel.noAskPrice * 100)}¢) = ${Math.round(totalCost * 100)}¢ ≥ 100¢`,
        variant: "destructive",
      });
      return;
    }
    
    // Get top 7 profitable levels, ensuring clicked level is included and ranked by edge
    const profitableLevelsSorted = Array.from(levelEdges.entries())
      .filter(([_, edge]) => edge.isProfitable)
      .sort((a, b) => b[1].netEdgePct - a[1].netEdgePct)
      .slice(0, 7);
    
    // If clicked level is not in top 7 but is profitable, include it
    const clickedEdge = levelEdges.get(clickedLevelPrice);
    if (clickedEdge?.isProfitable) {
      const isInTop7 = profitableLevelsSorted.some(([p]) => Math.abs(p - clickedLevelPrice) < 0.005);
      if (!isInTop7) {
        // Replace the lowest-edge level with clicked level
        if (profitableLevelsSorted.length >= 7) {
          profitableLevelsSorted.pop();
        }
        profitableLevelsSorted.push([clickedLevelPrice, clickedEdge]);
        profitableLevelsSorted.sort((a, b) => b[1].netEdgePct - a[1].netEdgePct);
      }
    }
    
    if (profitableLevelsSorted.length === 0) {
      toast({
        title: "No Profitable Levels",
        description: "No arbitrage opportunities meeting minimum edge threshold",
        variant: "destructive",
      });
      return;
    }
    
    // Deploy orders
    setIsDeploying(true);
    
    const tierShares = calculateTieredShares(positionSize, profitableLevelsSorted.length);
    
    const newOrders: ActiveLadderOrder[] = profitableLevelsSorted.flatMap(([price], index) => {
      const level = orderBook.levels.find(l => Math.abs(l.price - price) < 0.005);
      if (!level) return [];
      
      const levelTotalCost = level.yesAskPrice + level.noAskPrice;
      const arbPerShare = 1 - levelTotalCost;
      const arbAmount = arbPerShare * tierShares[index];
      
      return [
        {
          id: `order-${Date.now()}-yes-${index}`,
          ladderIndex: index + 1,
          side: 'YES' as const,
          price: level.yesAskPrice,
          levelPrice: price,
          shares: tierShares[index],
          filledShares: 0,
          fillPercent: 0,
          status: 'pending' as const,
          arbAmount,
        },
        {
          id: `order-${Date.now()}-no-${index}`,
          ladderIndex: index + 1,
          side: 'NO' as const,
          price: level.noAskPrice,
          levelPrice: price,
          shares: tierShares[index],
          filledShares: 0,
          fillPercent: 0,
          status: 'pending' as const,
          arbAmount,
        },
      ];
    });
    
    setDeployedOrders(prev => [...prev, ...newOrders]);
    setIsDeploying(false);
    
    toast({
      title: "Tiered Arb Orders Deployed",
      description: `${profitableLevelsSorted.length} arb levels (${newOrders.length} orders) @ $${positionSize}`,
    });
  }, [orderBook, levelEdges, positionSize]);

  // Deploy ladder orders
  const handleDeployLadder = useCallback(async () => {
    if (!currentEdge) return;
    
    setIsDeploying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockOrders: ActiveLadderOrder[] = Array.from({ length: 7 }, (_, i) => ({
        id: `order-${Date.now()}-${i}`,
        ladderIndex: i + 1,
        side: i % 2 === 0 ? 'YES' : 'NO',
        price: currentEdge.yesPrice + (i - 3) * 0.01,
        levelPrice: Math.round((currentEdge.yesPrice + (i - 3) * 0.01) * 100) / 100,
        shares: Math.floor(size * (1 - i * 0.1)),
        filledShares: 0,
        fillPercent: 0,
        status: 'pending',
        arbAmount: (1 - currentEdge.totalCost) * Math.floor(size * (1 - i * 0.1)),
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
      setPreviewPrices(new Map());
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

  // Find midpoint level (LTP)
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

  // Auto-deploy effect: deploy orders when autoTradeEnabled and profitable levels change
  useEffect(() => {
    // Only run when auto-trade is enabled and not paused
    if (!autoTradeEnabled || isPaused || isDeploying || !orderBook) return;
    
    // Get current top 7 profitable levels directly from levelEdges
    const top7 = Array.from(levelEdges.entries())
      .filter(([_, edge]) => edge.isProfitable)
      .sort((a, b) => b[1].netEdgePct - a[1].netEdgePct)
      .slice(0, 7);
      
    if (top7.length === 0) {
      // Clear orders if no profitable levels
      prevProfitableLevelsRef.current = '';
      setDeployedOrders([]);
      return;
    }
    
    // Create a fingerprint of current profitable levels WITH actual prices
    // This triggers redeploy whenever YES or NO prices change at any level
    const currentLevelsKey = top7.map(([price]) => {
      const level = orderBook.levels.find(l => l.price === price);
      if (!level) return price.toFixed(2);
      return `${price.toFixed(2)}:${level.yesAskPrice.toFixed(3)}:${level.noAskPrice.toFixed(3)}`;
    }).join(',');
    
    // Skip if levels haven't changed
    if (currentLevelsKey === prevProfitableLevelsRef.current) return;
    prevProfitableLevelsRef.current = currentLevelsKey;
    
    // Auto-deploy orders at these levels
    const tierShares = calculateTieredShares(positionSize, top7.length);
    
      const newOrders: ActiveLadderOrder[] = top7.flatMap(([price, edge], index) => {
        const level = orderBook.levels.find(l => l.price === price);
        if (!level) return [];
        
        const totalCost = level.yesAskPrice + level.noAskPrice;
        const arbPerShare = 1 - totalCost;
        const arbAmount = arbPerShare * tierShares[index];
        
        return [
          {
            id: `auto-${Date.now()}-yes-${index}`,
            ladderIndex: index + 1,
            side: 'YES' as const,
            price: level.yesAskPrice,
            levelPrice: price,
            shares: tierShares[index],
            filledShares: 0,
            fillPercent: 0,
            status: 'pending' as const,
            arbAmount,
          },
          {
            id: `auto-${Date.now()}-no-${index}`,
            ladderIndex: index + 1,
            side: 'NO' as const,
            price: level.noAskPrice,
            levelPrice: price,
            shares: tierShares[index],
            filledShares: 0,
            fillPercent: 0,
            status: 'pending' as const,
            arbAmount,
          },
        ];
      });
    
    // Replace all orders with new ones (simulates cancel + redeploy)
    setDeployedOrders(newOrders);
    
  }, [autoTradeEnabled, isPaused, isDeploying, levelEdges, positionSize, orderBook]);

  // Clear ref when auto-trade is disabled
  useEffect(() => {
    if (!autoTradeEnabled) {
      prevProfitableLevelsRef.current = '';
    }
  }, [autoTradeEnabled]);

  // Handle row click for arbitrage pairing
  const handleArbRowClick = useCallback((clickedPrice: number) => {
    const edge = levelEdges.get(clickedPrice);
    if (!edge?.isProfitable) return;
    
    // Get actual prices from the level
    const level = orderBook?.levels.find(l => l.price === clickedPrice);
    if (!level) return;
    
    const yesPrice = level.yesAskPrice;
    const noPrice = level.noAskPrice;
    const totalCost = yesPrice + noPrice;
    
    // Only proceed if total < $1.00 (arb exists)
    if (totalCost >= 1.0) return;
    
    // Calculate allocation: split stake evenly between YES and NO
    const perLegAllocation = Math.floor(positionSize / 2);
    
    setPairedSelection({
      levelPrice: clickedPrice,
      yesPrice,
      noPrice,
      totalCost,
      edgePct: edge.netEdgePct,
      yesAllocation: perLegAllocation,
      noAllocation: perLegAllocation,
    });
    
    // Highlight this level in preview
    const previewMap = new Map<number, { tier: number; allocation: number }>();
    previewMap.set(clickedPrice, { tier: 1, allocation: perLegAllocation });
    setPreviewPrices(previewMap);
  }, [levelEdges, orderBook, positionSize]);

  // Handle confirmation of paired order
  const handleConfirmPairedOrder = useCallback(async () => {
    if (!pairedSelection) return;
    
    setIsDeploying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const arbPerShare = 1 - pairedSelection.totalCost;
      const arbAmount = arbPerShare * pairedSelection.yesAllocation;
      
      const newOrders: ActiveLadderOrder[] = [
        {
          id: `order-${Date.now()}-yes`,
          ladderIndex: 1,
          side: 'YES',
          price: pairedSelection.yesPrice,
          levelPrice: pairedSelection.levelPrice,
          shares: pairedSelection.yesAllocation,
          filledShares: 0,
          fillPercent: 0,
          status: 'pending',
          arbAmount,
        },
        {
          id: `order-${Date.now()}-no`,
          ladderIndex: 1,
          side: 'NO',
          price: pairedSelection.noPrice,
          levelPrice: pairedSelection.levelPrice,
          shares: pairedSelection.noAllocation,
          filledShares: 0,
          fillPercent: 0,
          status: 'pending',
          arbAmount,
        },
      ];
      
      setDeployedOrders(prev => [...prev, ...newOrders]);
      setPairedSelection(null);
      setPreviewPrices(new Map());
      
      toast({
        title: "Paired Arb Order Deployed",
        description: `YES @ ${Math.round(pairedSelection.yesPrice * 100)}¢ + NO @ ${Math.round(pairedSelection.noPrice * 100)}¢ = ${Math.round(pairedSelection.totalCost * 100)}¢`,
      });
    } finally {
      setIsDeploying(false);
    }
  }, [pairedSelection]);

  // Clear paired selection
  const handleClearSelection = useCallback(() => {
    setPairedSelection(null);
    setPreviewPrices(new Map());
  }, []);

  // Quick deploy best arb with tiered sizing
  const handleQuickDeploy = useCallback(async () => {
    if (!bestArb) return;
    
    setIsDeploying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const profitableLevelsSorted = getTop7Profitable();
      if (profitableLevelsSorted.length === 0) return;
      
      const tierShares = calculateTieredShares(positionSize, profitableLevelsSorted.length);
      
      const newOrders: ActiveLadderOrder[] = profitableLevelsSorted.flatMap(([price], index) => {
        const level = orderBook?.levels.find(l => l.price === price);
        if (!level) return [];
        
        const totalCost = level.yesAskPrice + level.noAskPrice;
        const arbPerShare = 1 - totalCost;
        const arbAmount = arbPerShare * tierShares[index];
        
        return [
          {
            id: `order-${Date.now()}-yes-${index}`,
            ladderIndex: index + 1,
            side: 'YES' as const,
            price: level.yesAskPrice,
            levelPrice: price,
            shares: tierShares[index],
            filledShares: 0,
            fillPercent: 0,
            status: 'pending' as const,
            arbAmount,
          },
          {
            id: `order-${Date.now()}-no-${index}`,
            ladderIndex: index + 1,
            side: 'NO' as const,
            price: level.noAskPrice,
            levelPrice: price,
            shares: tierShares[index],
            filledShares: 0,
            fillPercent: 0,
            status: 'pending' as const,
            arbAmount,
          },
        ];
      });
      
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
            <span>Price moved outside ±15% range. Consider cancelling orders.</span>
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

        {/* Main Ladder Card */}
        <Card className="xl:col-span-3 border-border bg-card overflow-hidden">
          <CardHeader className="pb-2 space-y-3">
            {/* Top row: Title + Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base font-semibold">{asset} Order Book</CardTitle>
                <span className="text-xs text-muted-foreground font-mono">
                  Tick: {orderBook?.tick ?? 0.01}
                </span>
                {/* Pause/Refresh buttons */}
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

                {/* Cancel Preview/Orders */}
                {(previewPrices.size > 0 || deployedOrders.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreviewPrices(new Map());
                      if (deployedOrders.length > 0) handleCancelAll();
                    }}
                    className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-3.5 w-3.5" />
                    {deployedOrders.length > 0 ? `Cancel ${deployedOrders.length} Orders` : 'Clear Preview'}
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Stake Buttons */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <QuickStakeButtons
                currentStake={positionSize}
                onStakeChange={setPositionSize}
              />
              <span className="text-xs text-muted-foreground font-mono">
                Range: {rangeMin.toFixed(2)} - {rangeMax.toFixed(2)}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Deployed Orders Banner */}
            {deployedOrders.length > 0 && (
              <div className={cn(
                "flex items-center justify-between px-4 py-2 border-b",
                autoTradeEnabled 
                  ? "bg-success/10 border-success/30" 
                  : "bg-warning/10 border-warning/30"
              )}>
                <span className={cn(
                  "text-xs font-medium",
                  autoTradeEnabled ? "text-success" : "text-warning"
                )}>
                  {autoTradeEnabled 
                    ? `AUTO: ${deployedOrders.length / 2} arb levels active` 
                    : `${deployedOrders.length} orders deployed across ${new Set(deployedOrders.map(o => o.ladderIndex)).size} tiers`}
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

            {/* BetAngel Side-by-Side Ladders with Spread Indicator */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-2 p-4">
              <BetAngelLadder
                side="YES"
                levels={visibleLevels}
                levelEdges={levelEdges}
                profitableLevels={profitableLevels}
                deployedOrders={deployedOrders}
                ltpPrice={midpointPrice}
                momentum="same"
                previewPrices={previewPrices}
                pairedSelection={pairedSelection}
                onBackClick={(price) => handleCellClick(price, 'YES', 'bid')}
                onLayClick={(price) => handleCellClick(price, 'YES', 'ask')}
                onPriceClick={handleArbRowClick}
              />
              
              {/* Center Spread Indicator + Paired Selection */}
              <div className="hidden md:flex flex-col items-center pt-20 gap-4">
                <SpreadIndicator
                  yesBestAsk={midpointPrice}
                  noBestAsk={1 - midpointPrice}
                />
                
                {/* Paired Selection Summary Banner */}
                {pairedSelection && (
                  <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-center min-w-[200px]">
                    <div className="text-xs text-success font-medium mb-1">
                      Paired Arbitrage Ready
                    </div>
                    <div className="font-mono text-sm">
                      <span className="text-[hsl(var(--poly-yes))]">
                        YES @ {Math.round(pairedSelection.yesPrice * 100)}¢
                      </span>
                      {' + '}
                      <span className="text-[hsl(var(--poly-no))]">
                        NO @ {Math.round(pairedSelection.noPrice * 100)}¢
                      </span>
                    </div>
                    <div className="font-mono text-sm font-bold text-success mt-1">
                      = {Math.round(pairedSelection.totalCost * 100)}¢
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Edge: +{pairedSelection.edgePct.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${pairedSelection.yesAllocation} + ${pairedSelection.noAllocation}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleClearSelection}
                        className="flex-1 h-7 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleConfirmPairedOrder}
                        disabled={isDeploying}
                        className="flex-1 h-7 text-xs bg-success hover:bg-success/90 text-success-foreground"
                      >
                        {isDeploying ? 'Deploying...' : 'Confirm'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <BetAngelLadder
                side="NO"
                levels={visibleLevels}
                levelEdges={levelEdges}
                profitableLevels={profitableLevels}
                deployedOrders={deployedOrders}
                ltpPrice={1 - midpointPrice}
                momentum="same"
                previewPrices={previewPrices}
                pairedSelection={pairedSelection}
                onBackClick={(price) => handleCellClick(price, 'NO', 'bid')}
                onLayClick={(price) => handleCellClick(price, 'NO', 'ask')}
                onPriceClick={handleArbRowClick}
              />
            </div>

            {/* Mobile Paired Selection Banner */}
            {pairedSelection && (
              <div className="md:hidden bg-success/10 border-t border-success/30 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-success font-medium">Paired Arbitrage</div>
                    <div className="font-mono text-sm">
                      <span className="text-[hsl(var(--poly-yes))]">{Math.round(pairedSelection.yesPrice * 100)}¢</span>
                      {' + '}
                      <span className="text-[hsl(var(--poly-no))]">{Math.round(pairedSelection.noPrice * 100)}¢</span>
                      {' = '}
                      <span className="font-bold text-success">{Math.round(pairedSelection.totalCost * 100)}¢</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClearSelection}
                      className="h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleConfirmPairedOrder}
                      disabled={isDeploying}
                      className="h-8 bg-success hover:bg-success/90 text-success-foreground"
                    >
                      {isDeploying ? 'Deploying...' : 'Confirm'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
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

          <LimitOrdersTable
            orders={deployedOrders}
            onCancelAll={handleCancelAll}
            isCancelling={isCancelling}
          />
        </div>
      </div>

      {/* Limit Orders Table Below Ladder */}
      <LimitOrdersTable
        orders={deployedOrders}
        onCancelAll={handleCancelAll}
        isCancelling={isCancelling}
      />
    </div>
  );
}
