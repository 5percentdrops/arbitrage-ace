import { useState, useCallback, useMemo } from 'react';
import { AlertTriangle, RefreshCw, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useAutoOrderBook } from '@/hooks/useAutoOrderBook';
import { SpreadCalculator } from './SpreadCalculator';
import { AutoOrdersPanel } from './AutoOrdersPanel';
import { LadderRow } from './LadderRow';
import type { LadderSelection, ActiveLadderOrder, LevelEdgeInfo } from '@/types/auto-trading';
import type { TokenSymbol } from '@/types/trading';

interface AutoLadderProps {
  asset: TokenSymbol;
  marketId: string;
}

export function AutoLadder({ asset, marketId }: AutoLadderProps) {
  const [size, setSize] = useState(10);
  const [minNetEdgePct, setMinNetEdgePct] = useState(0.5);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [deployedOrders, setDeployedOrders] = useState<ActiveLadderOrder[]>([]);

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
  } = useAutoOrderBook({ marketId, minNetEdgePct });

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

  // Filter levels within range
  const visibleLevels = useMemo(() => {
    if (!orderBook) return [];
    return orderBook.levels.filter(
      level => level.price >= rangeMin && level.price <= rangeMax
    );
  }, [orderBook, rangeMin, rangeMax]);

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

  // Quick deploy best arb
  const handleQuickDeploy = useCallback(async () => {
    if (!bestArb) return;
    
    setIsDeploying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const yesPrice = bestArb.price;
      const noPrice = 1 - bestArb.price;
      
      const mockOrders: ActiveLadderOrder[] = [
        {
          id: `order-${Date.now()}-yes`,
          ladderIndex: 1,
          side: 'YES',
          price: yesPrice,
          shares: size,
          filledShares: 0,
          fillPercent: 0,
          status: 'pending',
        },
        {
          id: `order-${Date.now()}-no`,
          ladderIndex: 2,
          side: 'NO',
          price: noPrice,
          shares: size,
          filledShares: 0,
          fillPercent: 0,
          status: 'pending',
        },
      ];
      
      setDeployedOrders(prev => [...prev, ...mockOrders]);
    } finally {
      setIsDeploying(false);
    }
  }, [bestArb, size]);

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
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">{asset} Order Book Ladder</CardTitle>
              <span className="text-xs text-muted-foreground font-mono">
                Tick: {orderBook?.tick ?? 0.01} | Range: {(rangeMin).toFixed(2)} - {(rangeMax).toFixed(2)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
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
