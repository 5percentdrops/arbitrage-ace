import { useState, useCallback, useEffect } from 'react';
import {
  DumpHedgeState,
  DumpHedgeParams,
  DumpHedgeCycle,
  DumpHedgeCycleState,
  DumpHedgeLeg,
  DEFAULT_DUMP_HEDGE_STATE,
} from '@/types/trading';

const STORAGE_KEY = 'dump-hedge-state';
const MAX_HISTORY_SIZE = 5;

// Generate unique cycle ID
const generateCycleId = () => `dh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function useDumpHedge() {
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<DumpHedgeState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_DUMP_HEDGE_STATE,
          ...parsed,
          // Always start disabled on reload for safety
          enabled: false,
          // Parse dates back from JSON
          currentCycle: parsed.currentCycle
            ? {
                ...parsed.currentCycle,
                leg1: parsed.currentCycle.leg1
                  ? { ...parsed.currentCycle.leg1, executedAt: new Date(parsed.currentCycle.leg1.executedAt) }
                  : null,
                leg2: parsed.currentCycle.leg2
                  ? { ...parsed.currentCycle.leg2, executedAt: new Date(parsed.currentCycle.leg2.executedAt) }
                  : null,
                completedAt: parsed.currentCycle.completedAt
                  ? new Date(parsed.currentCycle.completedAt)
                  : null,
              }
            : null,
          cycleHistory: (parsed.cycleHistory || []).map((cycle: DumpHedgeCycle) => ({
            ...cycle,
            leg1: cycle.leg1 ? { ...cycle.leg1, executedAt: new Date(cycle.leg1.executedAt) } : null,
            leg2: cycle.leg2 ? { ...cycle.leg2, executedAt: new Date(cycle.leg2.executedAt) } : null,
            completedAt: cycle.completedAt ? new Date(cycle.completedAt) : null,
          })),
        };
      }
    } catch (e) {
      console.error('Failed to load dump-hedge state:', e);
    }
    return DEFAULT_DUMP_HEDGE_STATE;
  });

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save dump-hedge state:', e);
    }
  }, [state]);

  // Toggle auto mode
  const toggleAutoMode = useCallback(() => {
    setState((prev) => {
      const newEnabled = !prev.enabled;
      // When enabling, start a fresh cycle if none exists
      if (newEnabled && !prev.currentCycle) {
        return {
          ...prev,
          enabled: true,
          currentCycle: {
            id: generateCycleId(),
            leg1: null,
            leg2: null,
            lockedProfit: 0,
            lockedProfitPercent: 0,
            status: 'waiting',
            completedAt: null,
          },
        };
      }
      return { ...prev, enabled: newEnabled };
    });
  }, []);

  // Update parameters (only when not enabled)
  const updateParams = useCallback((updates: Partial<DumpHedgeParams>) => {
    setState((prev) => {
      if (prev.enabled) return prev; // Prevent updates while running
      return {
        ...prev,
        params: { ...prev.params, ...updates },
      };
    });
  }, []);

  // Execute Leg1 (called when dump condition is detected)
  const executeLeg1 = useCallback((side: 'YES' | 'NO', entryPrice: number, shares: number) => {
    setState((prev) => {
      // Safety: Only execute if in waiting state and Leg1 hasn't been executed
      if (!prev.currentCycle || prev.currentCycle.status !== 'waiting' || prev.currentCycle.leg1) {
        console.warn('Cannot execute Leg1: Invalid state');
        return prev;
      }

      const leg1: DumpHedgeLeg = {
        side,
        entryPrice,
        shares,
        executedAt: new Date(),
      };

      return {
        ...prev,
        currentCycle: {
          ...prev.currentCycle,
          leg1,
          status: 'leg1_executed',
        },
      };
    });
  }, []);

  // Execute Leg2 (called when hedge condition is met)
  const executeLeg2 = useCallback((side: 'YES' | 'NO', entryPrice: number, shares: number) => {
    setState((prev) => {
      // Safety: Only execute if Leg1 is done and Leg2 hasn't been executed
      if (!prev.currentCycle || prev.currentCycle.status !== 'leg1_executed' || !prev.currentCycle.leg1) {
        console.warn('Cannot execute Leg2: Invalid state');
        return prev;
      }

      const leg1Price = prev.currentCycle.leg1.entryPrice;
      const lockedProfit = 1 - (leg1Price + entryPrice);
      const lockedProfitPercent = (lockedProfit / (leg1Price + entryPrice)) * 100;

      const leg2: DumpHedgeLeg = {
        side,
        entryPrice,
        shares,
        executedAt: new Date(),
      };

      return {
        ...prev,
        currentCycle: {
          ...prev.currentCycle,
          leg2,
          lockedProfit,
          lockedProfitPercent,
          status: 'leg2_executed',
        },
      };
    });
  }, []);

  // Settle cycle and add to history
  const settleCycle = useCallback(() => {
    setState((prev) => {
      if (!prev.currentCycle || prev.currentCycle.status !== 'leg2_executed') {
        return prev;
      }

      const completedCycle: DumpHedgeCycle = {
        ...prev.currentCycle,
        status: 'settled',
        completedAt: new Date(),
      };

      // Add to history, keeping only last N cycles
      const newHistory = [completedCycle, ...prev.cycleHistory].slice(0, MAX_HISTORY_SIZE);

      // Start new cycle if still enabled
      const newCycle = prev.enabled
        ? {
            id: generateCycleId(),
            leg1: null,
            leg2: null,
            lockedProfit: 0,
            lockedProfitPercent: 0,
            status: 'waiting' as DumpHedgeCycleState,
            completedAt: null,
          }
        : null;

      return {
        ...prev,
        currentCycle: newCycle,
        cycleHistory: newHistory,
      };
    });
  }, []);

  // Reset current cycle (cancel without settling)
  const resetCycle = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentCycle: prev.enabled
        ? {
            id: generateCycleId(),
            leg1: null,
            leg2: null,
            lockedProfit: 0,
            lockedProfitPercent: 0,
            status: 'waiting',
            completedAt: null,
          }
        : null,
    }));
  }, []);

  // Validation: Check if Leg2 can be executed based on locked percent target
  const canExecuteLeg2 = useCallback(
    (oppositeAsk: number): boolean => {
      if (!state.currentCycle?.leg1) return false;
      const leg1Price = state.currentCycle.leg1.entryPrice;
      const potentialProfit = 1 - (leg1Price + oppositeAsk);
      return potentialProfit >= state.params.lockedPercent;
    },
    [state.currentCycle?.leg1, state.params.lockedPercent]
  );

  // Validation warnings
  const getWarnings = useCallback((): string[] => {
    const warnings: string[] = [];
    if (state.params.discoveryPercent > 0.50) {
      warnings.push('Discovery % is very high (>50%). Opportunities may rarely trigger.');
    }
    if (state.params.lockedPercent < 0.01) {
      warnings.push('Locked % is very low (<1%). Consider a higher target.');
    }
    if (state.params.leg1Shares < 1) {
      warnings.push('Leg 1 shares must be at least 1.');
    }
    if (state.params.leg2Shares < 1) {
      warnings.push('Leg 2 shares must be at least 1.');
    }
    if (state.params.windowMinutes < 1) {
      warnings.push('Window must be at least 1 minute.');
    }
    return warnings;
  }, [state.params]);

  return {
    state,
    toggleAutoMode,
    updateParams,
    executeLeg1,
    executeLeg2,
    settleCycle,
    resetCycle,
    canExecuteLeg2,
    getWarnings,
  };
}
