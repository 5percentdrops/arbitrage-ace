import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  OrderBookData, 
  LadderSelection, 
  ArbitrageEdge,
  ActiveLadderOrder,
  LevelEdgeInfo 
} from '@/types/auto-trading';
import { generateMockOrderBook } from '@/services/autoApi';

const POLL_INTERVAL = 300; // 300ms
const RANGE_PCT = 0.15; // ±15% range around reference

interface UseAutoOrderBookOptions {
  marketId: string;
  minNetEdgePct: number;
}

interface UseAutoOrderBookReturn {
  orderBook: OrderBookData | null;
  isLoading: boolean;
  error: string | null;
  
  // Selection state
  yesSelection: LadderSelection | null;
  noSelection: LadderSelection | null;
  setYesSelection: (selection: LadderSelection | null) => void;
  setNoSelection: (selection: LadderSelection | null) => void;
  clearSelections: () => void;
  
  // Suggestions
  suggestedCounterpart: LadderSelection | null;
  
  // Edge calculations
  currentEdge: ArbitrageEdge | null;
  profitableLevels: Set<number>; // prices that meet threshold
  levelEdges: Map<number, LevelEdgeInfo>; // per-level edge info
  
  // Range state
  isOutOfRange: boolean;
  rangeMin: number;
  rangeMax: number;
  
  // Active orders
  activeOrders: ActiveLadderOrder[];
  
  // Actions
  refresh: () => void;
}

export function useAutoOrderBook({ 
  marketId, 
  minNetEdgePct 
}: UseAutoOrderBookOptions): UseAutoOrderBookReturn {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [yesSelection, setYesSelection] = useState<LadderSelection | null>(null);
  const [noSelection, setNoSelection] = useState<LadderSelection | null>(null);
  const [activeOrders, setActiveOrders] = useState<ActiveLadderOrder[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate range bounds
  const rangeMin = orderBook ? orderBook.refPrice * (1 - RANGE_PCT) : 0;
  const rangeMax = orderBook ? orderBook.refPrice * (1 + RANGE_PCT) : 1;
  
  // Check if current best prices are out of range
  const isOutOfRange = orderBook ? (
    orderBook.best.yesAsk < rangeMin || 
    orderBook.best.yesAsk > rangeMax ||
    orderBook.best.noAsk < rangeMin ||
    orderBook.best.noAsk > rangeMax
  ) : false;
  
  // Calculate profitable levels and level edges
  // Arbitrage exists when buying YES at price X and NO at price (1-X) costs less than $1
  const profitableLevels = new Set<number>();
  const levelEdges = new Map<number, LevelEdgeInfo>();
  
  if (orderBook) {
    orderBook.levels.forEach(level => {
      // YES ask price is the level price, NO ask is at complementary level
      const yesAskPrice = level.price;
      const noAskPrice = 1 - level.price;
      const totalCost = yesAskPrice + noAskPrice; // Always 1.0 in simple model
      
      // For realistic arb, we need to check if there's a mismatch in the market
      // Simulate edge based on level position relative to 0.50
      // Levels closer to 0.50 have better edge (market inefficiency)
      const distFromMid = Math.abs(level.price - 0.50);
      const baseEdge = 0.02 - (distFromMid * 0.1); // Max 2% edge at midpoint
      const grossEdge = Math.max(0, baseEdge);
      const grossEdgePct = grossEdge * 100;
      const fee = orderBook.fee.takerPct / 100;
      const netEdge = grossEdge - (fee * 2); // Fee on both sides
      const netEdgePct = netEdge * 100;
      const isProfitable = netEdgePct >= minNetEdgePct;
      
      levelEdges.set(level.price, {
        totalCost: 1 - grossEdge, // Show effective cost
        grossEdgePct,
        netEdgePct,
        isProfitable,
      });
      
      if (isProfitable) {
        profitableLevels.add(level.price);
      }
    });
  }
  
  // Calculate current edge based on selections
  const currentEdge: ArbitrageEdge | null = (() => {
    if (!orderBook || !yesSelection || !noSelection) return null;
    
    const yesPrice = yesSelection.price;
    const noPrice = noSelection.price;
    const totalCost = yesPrice + noPrice;
    const grossEdge = 1.0 - totalCost;
    const grossEdgePct = grossEdge * 100;
    const fee = orderBook.fee.takerPct / 100;
    const netEdge = grossEdge - (fee * 2);
    const netEdgePct = netEdge * 100;
    
    return {
      grossEdge,
      grossEdgePct,
      netEdge,
      netEdgePct,
      totalCost,
      yesPrice,
      noPrice,
    };
  })();
  
  // Calculate suggested counterpart
  const suggestedCounterpart: LadderSelection | null = (() => {
    if (!orderBook) return null;
    
    // If YES selected, suggest best NO that creates positive edge
    if (yesSelection && !noSelection) {
      const yesPrice = yesSelection.price;
      const targetNoPrice = 1.0 - yesPrice - (orderBook.fee.takerPct / 100 * 2) - (minNetEdgePct / 100);
      
      // Find best NO ask at or below target
      const sortedLevels = [...orderBook.levels].sort((a, b) => a.price - b.price);
      for (const level of sortedLevels) {
        const noPrice = 1 - level.price;
        if (level.noAsk > 0 && noPrice <= targetNoPrice) {
          return { side: 'NO', price: noPrice, type: 'ask' };
        }
      }
    }
    
    // If NO selected, suggest best YES that creates positive edge
    if (noSelection && !yesSelection) {
      const noPrice = noSelection.price;
      const targetYesPrice = 1.0 - noPrice - (orderBook.fee.takerPct / 100 * 2) - (minNetEdgePct / 100);
      
      const sortedLevels = [...orderBook.levels].sort((a, b) => b.price - a.price);
      for (const level of sortedLevels) {
        if (level.yesAsk > 0 && level.price <= targetYesPrice) {
          return { side: 'YES', price: level.price, type: 'ask' };
        }
      }
    }
    
    return null;
  })();
  
  // Fetch order book (using mock data for now)
  const fetchData = useCallback(async () => {
    try {
      // In production, replace with actual API call:
      // const data = await fetchOrderBook(marketId);
      const data = generateMockOrderBook();
      setOrderBook(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order book');
    } finally {
      setIsLoading(false);
    }
  }, [marketId]);
  
  // Start polling
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData]);
  
  // Clear selections
  const clearSelections = useCallback(() => {
    setYesSelection(null);
    setNoSelection(null);
  }, []);
  
  return {
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
    activeOrders,
    refresh: fetchData,
  };
}
