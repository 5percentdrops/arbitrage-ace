import { ManualTradePanel } from '@/components/trading/ManualTradePanel';
import type { ManualTradeFormState, ValidationErrors } from '@/types/manual-trading';

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
  
  // Signal section data
  crowdSide?: 'UP' | 'DOWN';
  crowdPct?: number;
  secondsRemaining: number;
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
  crowdSide,
  crowdPct,
  secondsRemaining,
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
      crowdSide={crowdSide}
      crowdPct={crowdPct}
      secondsRemaining={secondsRemaining}
    />
  );
}
