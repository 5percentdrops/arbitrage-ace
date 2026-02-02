import { useState, useCallback, useEffect, useMemo } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { usePolymarketWebSocket } from '@/hooks/usePolymarketWebSocket';
import { getAssetIds } from '@/lib/polymarketConfig';
import type { TokenSymbol } from '@/types/trading';
import type {
  ManualOrder,
  ManualTradeFormState,
  MarketSnapshot,
  OpenOrder,
  WebSocketStatus,
} from '@/types/manual-trading';

export interface UseManualTradingOptions {
  isBotRunning: boolean;
}

export interface ValidationErrors {
  shares?: string;
  limitPrice?: string;
  notionalUsd?: string;
}

export function useManualTrading({ isBotRunning }: UseManualTradingOptions) {
  const [formState, setFormState] = useState<ManualTradeFormState>({
    asset: 'BTC',
    outcome: 'YES',
    action: 'BUY',
    orderType: 'LIMIT',
    shares: '',
    limitPrice: '',
    useNotional: true,
    notionalUsd: '',
    crowdPct: '',
    remainingTime: '',
  });

  const [allowManualWhileAuto, setAllowManualWhileAuto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Open orders state (still fetched via REST)
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Get asset IDs for WebSocket based on selected asset
  const assetIds = useMemo(() => getAssetIds(formState.asset), [formState.asset]);

  // WebSocket connection for real-time market data
  const {
    marketSnapshot,
    connectionStatus: wsStatus,
    lastUpdateTime: snapshotLastUpdated,
    error: wsError,
    reconnect: reconnectWebSocket,
    isSimulated,
  } = usePolymarketWebSocket({
    assetIds,
    enabled: true,
  });

  // Validation
  const validate = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    if (formState.useNotional) {
      const notional = parseFloat(formState.notionalUsd);
      if (isNaN(notional) || notional <= 0) {
        errors.notionalUsd = 'Must be a positive number';
      }
    } else {
      const shares = parseFloat(formState.shares);
      if (isNaN(shares) || shares <= 0) {
        errors.shares = 'Must be a positive number';
      }
    }

    // Only validate limit price for LIMIT orders
    if (formState.orderType === 'LIMIT') {
      const price = parseFloat(formState.limitPrice);
      if (isNaN(price) || price < 0.01 || price > 0.99) {
        errors.limitPrice = 'Must be between 0.01 and 0.99';
      }
    }

    return errors;
  }, [formState]);

  const validationErrors = validate();
  const isValid = Object.keys(validationErrors).length === 0;
  const canSubmit = isValid && !isSubmitting && (!isBotRunning || allowManualWhileAuto);

  // Calculate estimated shares from notional
  const estimatedShares = useCallback(() => {
    if (!formState.useNotional || !marketSnapshot) return null;
    const notional = parseFloat(formState.notionalUsd);
    if (isNaN(notional) || notional <= 0) return null;
    
    const price = formState.outcome === 'YES' ? marketSnapshot.yesAsk : marketSnapshot.noAsk;
    if (!price || price <= 0) return null;
    
    return notional / price;
  }, [formState.useNotional, formState.notionalUsd, formState.outcome, marketSnapshot]);

  // Fetch open orders (still uses REST API)
  const fetchOpenOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    setOrdersError(null);
    
    const response = await apiGet<OpenOrder[]>('/orders/open', { asset: formState.asset });
    
    if (response.success && response.data) {
      setOpenOrders(response.data);
    } else {
      setOrdersError(response.error || 'Failed to fetch orders');
      setOpenOrders([]);
    }
    
    setIsLoadingOrders(false);
  }, [formState.asset]);

  // Auto-refresh open orders
  useEffect(() => {
    fetchOpenOrders();
    const ordersInterval = setInterval(fetchOpenOrders, 10000);
    return () => clearInterval(ordersInterval);
  }, [fetchOpenOrders]);

  // Submit order
  const submitOrder = useCallback(async () => {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const shares = formState.useNotional
      ? estimatedShares() || 0
      : parseFloat(formState.shares);

    const order: ManualOrder = {
      asset: formState.asset,
      outcome: formState.outcome,
      action: formState.action,
      orderType: formState.orderType,
      shares,
      ...(formState.orderType === 'LIMIT' && {
        limitPrice: parseFloat(formState.limitPrice),
      }),
      timeInForce: formState.orderType === 'LIMIT' ? 'GTC' : 'IOC',
    };

    const response = await apiPost('/order', order);
    
    if (response.success) {
      setSubmitSuccess(true);
      // Reset form
      setFormState(prev => ({
        ...prev,
        shares: '',
        limitPrice: '',
        notionalUsd: '',
      }));
      // Refresh orders
      await fetchOpenOrders();
    } else {
      setSubmitError(response.error || 'Failed to submit order');
    }
    
    setIsSubmitting(false);
  }, [canSubmit, formState, estimatedShares, fetchOpenOrders]);

  // Cancel all orders
  const cancelAllOrders = useCallback(async () => {
    const response = await apiPost('/order/cancel_all', { asset: formState.asset });
    
    if (response.success) {
      await fetchOpenOrders();
      return true;
    }
    return false;
  }, [formState.asset, fetchOpenOrders]);

  // Cancel single order
  const cancelOrder = useCallback(async (orderId: string) => {
    const response = await apiPost('/order/cancel', { orderId });
    
    if (response.success) {
      await fetchOpenOrders();
      return true;
    }
    return false;
  }, [fetchOpenOrders]);

  // Update form field
  const updateField = useCallback(<K extends keyof ManualTradeFormState>(
    field: K,
    value: ManualTradeFormState[K]
  ) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  return {
    formState,
    updateField,
    validationErrors,
    isValid,
    canSubmit,
    isSubmitting,
    submitError,
    submitSuccess,
    submitOrder,
    
    allowManualWhileAuto,
    setAllowManualWhileAuto,
    isBotRunning,
    
    // WebSocket-powered market data
    marketSnapshot,
    wsStatus,
    wsError,
    snapshotLastUpdated,
    reconnectWebSocket,
    isSimulated,
    
    openOrders,
    isLoadingOrders,
    ordersError,
    fetchOpenOrders,
    cancelOrder,
    cancelAllOrders,
    
    estimatedShares: estimatedShares(),
  };
}
