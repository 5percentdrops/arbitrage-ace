import { useState, useCallback, useEffect } from 'react';
import {
  BotState,
  BotStatus,
  TokenSymbol,
  FilterParams,
  CompoundingSettings,
  ExitSettings,
  ApiConfig,
  RpcConfig,
  WalletConfig,
  DEFAULT_FILTERS,
  DEFAULT_COMPOUNDING,
  DEFAULT_EXIT_SETTINGS,
  PreflightCheck,
} from '@/types/trading';

const STORAGE_KEY = 'crypto-arb-bot-state';

const initialApiConfig: ApiConfig = {
  apiKey: '',
  apiSecret: '',
  status: 'disconnected',
  lastConnected: null,
  error: null,
};

const initialRpcConfig: RpcConfig = {
  rpcUrl: '',
  chainId: 137,
  status: 'disconnected',
  blockNumber: null,
  error: null,
};

const initialWalletConfig: WalletConfig = {
  privateKey: '',
  address: null,
  maticBalance: 0,
  usdcBalance: 0,
};

const initialState: BotState = {
  status: 'stopped',
  selectedTokens: ['BTC', 'ETH'],
  filters: DEFAULT_FILTERS,
  compounding: DEFAULT_COMPOUNDING,
  exitSettings: DEFAULT_EXIT_SETTINGS,
  apiConfig: initialApiConfig,
  rpcConfig: initialRpcConfig,
  walletConfig: initialWalletConfig,
  availableCapital: 1000,
  lockedCapital: 0,
  lastTradeAt: null,
};

export function useBotState() {
  const [state, setState] = useState<BotState>(() => {
    // Load from localStorage on init
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialState, ...parsed, status: 'stopped' };
      }
    } catch (e) {
      console.error('Failed to load bot state:', e);
    }
    return initialState;
  });

  // Persist to localStorage on change
  useEffect(() => {
    try {
      // Don't save sensitive data
      const toSave = {
        ...state,
        apiConfig: { ...state.apiConfig, apiKey: '', apiSecret: '' },
        walletConfig: { ...state.walletConfig, privateKey: '' },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save bot state:', e);
    }
  }, [state]);

  // Bot control actions
  const startBot = useCallback(() => {
    setState(prev => ({ ...prev, status: 'starting' }));
    // Simulate startup delay
    setTimeout(() => {
      setState(prev => ({ ...prev, status: 'running' }));
    }, 1500);
  }, []);

  const stopBot = useCallback(() => {
    setState(prev => ({ ...prev, status: 'stopping' }));
    setTimeout(() => {
      setState(prev => ({ ...prev, status: 'stopped' }));
    }, 1000);
  }, []);

  const emergencyStop = useCallback(() => {
    setState(prev => ({ ...prev, status: 'stopped' }));
  }, []);

  // Token selection
  const toggleToken = useCallback((token: TokenSymbol) => {
    setState(prev => ({
      ...prev,
      selectedTokens: prev.selectedTokens.includes(token)
        ? prev.selectedTokens.filter(t => t !== token)
        : [...prev.selectedTokens, token],
    }));
  }, []);

  const setSelectedTokens = useCallback((tokens: TokenSymbol[]) => {
    setState(prev => ({ ...prev, selectedTokens: tokens }));
  }, []);

  // Filters
  const updateFilters = useCallback((filters: Partial<FilterParams>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
    }));
  }, []);

  // Compounding
  const updateCompounding = useCallback((settings: Partial<CompoundingSettings>) => {
    setState(prev => ({
      ...prev,
      compounding: { ...prev.compounding, ...settings },
    }));
  }, []);

  // Exit settings
  const updateExitSettings = useCallback((settings: Partial<ExitSettings>) => {
    setState(prev => ({
      ...prev,
      exitSettings: { ...prev.exitSettings, ...settings },
    }));
  }, []);

  // API config
  const updateApiConfig = useCallback((config: Partial<ApiConfig>) => {
    setState(prev => ({
      ...prev,
      apiConfig: { ...prev.apiConfig, ...config },
    }));
  }, []);

  // RPC config
  const updateRpcConfig = useCallback((config: Partial<RpcConfig>) => {
    setState(prev => ({
      ...prev,
      rpcConfig: { ...prev.rpcConfig, ...config },
    }));
  }, []);

  // Wallet config
  const updateWalletConfig = useCallback((config: Partial<WalletConfig>) => {
    setState(prev => ({
      ...prev,
      walletConfig: { ...prev.walletConfig, ...config },
    }));
  }, []);

  // Preflight checks
  const getPreflightChecks = useCallback((): PreflightCheck[] => {
    return [
      {
        id: 'api',
        label: 'API Connected',
        passed: state.apiConfig.status === 'connected',
        message: state.apiConfig.status !== 'connected' 
          ? 'Polymarket API not connected' 
          : undefined,
      },
      {
        id: 'rpc',
        label: 'RPC Connected',
        passed: state.rpcConfig.status === 'connected',
        message: state.rpcConfig.status !== 'connected' 
          ? 'Polygon RPC not connected' 
          : undefined,
      },
      {
        id: 'wallet',
        label: 'Wallet Configured',
        passed: !!state.walletConfig.address,
        message: !state.walletConfig.address 
          ? 'Wallet not configured' 
          : undefined,
      },
      {
        id: 'funded',
        label: 'Wallet Funded',
        passed: state.walletConfig.usdcBalance > 0,
        message: state.walletConfig.usdcBalance <= 0 
          ? 'Wallet has no USDC balance' 
          : undefined,
      },
      {
        id: 'tokens',
        label: 'Tokens Selected',
        passed: state.selectedTokens.length > 0,
        message: state.selectedTokens.length === 0 
          ? 'No tokens selected for scanning' 
          : undefined,
      },
      {
        id: 'params',
        label: 'Parameters Valid',
        passed: state.filters.minSpread < state.filters.maxSpread,
        message: state.filters.minSpread >= state.filters.maxSpread 
          ? 'Invalid spread parameters' 
          : undefined,
      },
    ];
  }, [state]);

  const canStartBot = useCallback(() => {
    const checks = getPreflightChecks();
    return checks.every(check => check.passed);
  }, [getPreflightChecks]);

  return {
    state,
    // Bot control
    startBot,
    stopBot,
    emergencyStop,
    // Token selection
    toggleToken,
    setSelectedTokens,
    // Settings
    updateFilters,
    updateCompounding,
    updateExitSettings,
    // Connections
    updateApiConfig,
    updateRpcConfig,
    updateWalletConfig,
    // Validation
    getPreflightChecks,
    canStartBot,
  };
}
