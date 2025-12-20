import { useState, useEffect, useCallback, useRef } from 'react';
import { ArbitrageOpportunity, FilterParams, TokenSymbol } from '@/types/trading';
import { generateMockOpportunities, updateOpportunityPrices } from '@/lib/mockData';

interface UseOpportunitiesOptions {
  tokens: TokenSymbol[];
  filters: FilterParams;
  isRunning: boolean;
  refreshInterval?: number;
}

export function useOpportunities({
  tokens,
  filters,
  isRunning,
  refreshInterval = 3000,
}: UseOpportunitiesOptions) {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate initial opportunities
  const loadOpportunities = useCallback(() => {
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const newOpps = generateMockOpportunities(10);
      setOpportunities(newOpps);
      setLastRefresh(new Date());
      setIsLoading(false);
    }, 500);
  }, []);

  // Filter opportunities based on current settings
  const filteredOpportunities = opportunities.filter(opp => {
    // Token filter
    if (!tokens.includes(opp.token)) return false;
    
    // Liquidity filter
    if (opp.liquidity < filters.minLiquidity) return false;
    
    // Volume filter
    if (opp.volume24h < filters.minVolume) return false;
    
    // Time to settlement filter
    if (opp.timeToSettlement < filters.minTimeToSettlement) return false;
    if (opp.timeToSettlement > filters.maxTimeToSettlement) return false;
    
    // Spread filter (combinedPrice should be between minSpread and maxSpread)
    if (opp.combinedPrice < filters.minSpread) return false;
    if (opp.combinedPrice > filters.maxSpread) return false;
    
    return true;
  });

  // Highlight opportunities that meet all criteria for arbitrage
  const highlightedOpportunities = filteredOpportunities.map(opp => ({
    ...opp,
    isArbitrage: opp.combinedPrice <= 0.98 && opp.spreadPercent > 0,
  }));

  // Auto-refresh when running
  useEffect(() => {
    if (isRunning) {
      // Initial load
      if (opportunities.length === 0) {
        loadOpportunities();
      }

      // Set up interval for price updates
      intervalRef.current = setInterval(() => {
        setOpportunities(prev => {
          // Update prices and occasionally add/remove opportunities
          const updated = updateOpportunityPrices(prev);
          
          // 20% chance to add a new opportunity
          if (Math.random() < 0.2 && updated.length < 15) {
            const newOpp = generateMockOpportunities(1)[0];
            updated.push(newOpp);
          }
          
          // 10% chance to remove an old opportunity
          if (Math.random() < 0.1 && updated.length > 5) {
            updated.shift();
          }
          
          return updated;
        });
        setLastRefresh(new Date());
      }, refreshInterval);
    } else {
      // Clear interval when not running
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, refreshInterval, loadOpportunities, opportunities.length]);

  const refresh = useCallback(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  return {
    opportunities: highlightedOpportunities,
    allOpportunities: opportunities,
    isLoading,
    lastRefresh,
    refresh,
  };
}
