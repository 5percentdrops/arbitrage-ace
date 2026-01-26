import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
}: TradingTabsProps) {
  return (
    <div className="space-y-4">
      {/* Manual Trading Panel */}
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
      />

      {/* Link to Auto Trading */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Auto Trading Ladder</span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/auto-trading">
                Open Auto Trading
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            Access the side-by-side YES/NO order book ladder with spread calculator and automated order deployment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
