import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManualTradePanel } from './ManualTradePanel';
import { AutoLadder } from './auto/AutoLadder';
import type { ManualTradeFormState, ValidationErrors, ManualTradingOrderType } from '@/types/manual-trading';
import type { TokenSymbol } from '@/types/trading';

interface TradingTabsProps {
  // Manual trading props
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
  
  // Auto trading props
  asset: TokenSymbol;
  marketId: string;
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
  asset,
  marketId,
}: TradingTabsProps) {
  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="manual" className="text-sm">
          Manual
        </TabsTrigger>
        <TabsTrigger value="auto" className="text-sm">
          Auto
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="manual" className="mt-0">
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
      </TabsContent>
      
      <TabsContent value="auto" className="mt-0">
        <AutoLadder asset={asset} marketId={marketId} />
      </TabsContent>
    </Tabs>
  );
}
