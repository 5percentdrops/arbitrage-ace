import { ManualTradePanel } from '@/components/trading/ManualTradePanel';
import type { ManualTradeFormState, ValidationErrors, WebSocketStatus, MarketSnapshot } from '@/types/manual-trading';

interface TradingTabsProps {
  formState: ManualTradeFormState;
  onFieldChange: <K extends keyof ManualTradeFormState>(
    field: K,
    value: ManualTradeFormState[K]
  ) => void;
  validationErrors: ValidationErrors;
  isValid: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  onSubmit: () => void;
  isBotRunning: boolean;
  onToggleBot: (enabled: boolean) => void;
  allowManualWhileAuto: boolean;
  onAllowManualChange: (allow: boolean) => void;
  estimatedShares: number | null;
  // WebSocket status
  wsStatus?: WebSocketStatus;
  wsError?: string | null;
  lastPriceUpdate?: Date | null;
  onReconnect?: () => void;
  isSimulated?: boolean;
  marketSnapshot?: MarketSnapshot | null;
}

export function TradingTabs({
  formState,
  onFieldChange,
  validationErrors,
  isValid,
  canSubmit,
  isSubmitting,
  submitError,
  submitSuccess,
  onSubmit,
  isBotRunning,
  onToggleBot,
  allowManualWhileAuto,
  onAllowManualChange,
  estimatedShares,
  wsStatus,
  wsError,
  lastPriceUpdate,
  onReconnect,
  isSimulated,
  marketSnapshot,
}: TradingTabsProps) {
  return (
    <ManualTradePanel
      formState={formState}
      onFieldChange={onFieldChange}
      validationErrors={validationErrors}
      isValid={isValid}
      canSubmit={canSubmit}
      isSubmitting={isSubmitting}
      submitError={submitError}
      submitSuccess={submitSuccess}
      onSubmit={onSubmit}
      isBotRunning={isBotRunning}
      onToggleBot={onToggleBot}
      allowManualWhileAuto={allowManualWhileAuto}
      onAllowManualChange={onAllowManualChange}
      estimatedShares={estimatedShares}
      wsStatus={wsStatus}
      wsError={wsError}
      lastPriceUpdate={lastPriceUpdate}
      onReconnect={onReconnect}
      isSimulated={isSimulated}
      marketSnapshot={marketSnapshot}
    />
  );
}
