import { ArrowUpDown, AlertTriangle, Check, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TOKENS, type TokenSymbol } from '@/types/trading';
import type { ManualTradeFormState, ValidationErrors, ManualTradingOrderType } from '@/types/manual-trading';
import { cn } from '@/lib/utils';

interface ManualTradePanelProps {
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
  allowManualWhileAuto: boolean;
  onAllowManualChange: (allow: boolean) => void;
  
  estimatedShares: number | null;
  currentAsk: number | null;
  
  isTradingDisabled?: boolean;
  disabledReason?: string | null;
}

export function ManualTradePanel({
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
  allowManualWhileAuto,
  onAllowManualChange,
  estimatedShares,
  currentAsk,
  isTradingDisabled,
  disabledReason,
}: ManualTradePanelProps) {
  const showBotWarning = isBotRunning && !allowManualWhileAuto;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">Manual Trading</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Bot running warning */}
        {isBotRunning && (
          <Alert variant="destructive" className="bg-warning/10 border-warning/30">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning text-sm">
              Manual orders may conflict with automation.
              <div className="flex items-center gap-2 mt-2">
                <Switch
                  id="allow-manual"
                  checked={allowManualWhileAuto}
                  onCheckedChange={onAllowManualChange}
                />
                <Label htmlFor="allow-manual" className="text-xs cursor-pointer">
                  Allow Manual Orders While Auto Runs
                </Label>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Trading disabled warning */}
        {isTradingDisabled && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {disabledReason || 'Trading disabled due to round ambiguity.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Asset Selection */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Asset</Label>
          <ToggleGroup
            type="single"
            value={formState.asset}
            onValueChange={(v) => v && onFieldChange('asset', v as TokenSymbol)}
            className="justify-start"
          >
            {TOKENS.map((token) => (
              <ToggleGroupItem
                key={token}
                value={token}
                className="px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {token}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Direction Selection - More Prominent */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Direction
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onFieldChange('outcome', 'YES')}
              className={cn(
                "h-14 rounded-lg font-bold text-lg transition-all duration-200",
                "flex items-center justify-center gap-2",
                "border-2",
                formState.outcome === 'YES'
                  ? "bg-success border-success text-success-foreground shadow-lg shadow-success/30"
                  : "bg-muted/30 border-muted-foreground/30 text-muted-foreground hover:border-success/50 hover:text-success"
              )}
            >
              <TrendingUp className="h-5 w-5" />
              UP
            </button>
            <button
              type="button"
              onClick={() => onFieldChange('outcome', 'NO')}
              className={cn(
                "h-14 rounded-lg font-bold text-lg transition-all duration-200",
                "flex items-center justify-center gap-2",
                "border-2",
                formState.outcome === 'NO'
                  ? "bg-destructive border-destructive text-destructive-foreground shadow-lg shadow-destructive/30"
                  : "bg-muted/30 border-muted-foreground/30 text-muted-foreground hover:border-destructive/50 hover:text-destructive"
              )}
            >
              <TrendingDown className="h-5 w-5" />
              DOWN
            </button>
          </div>
        </div>

        {/* Action Selection */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Action</Label>
          <ToggleGroup
            type="single"
            value={formState.action}
            onValueChange={(v) => v && onFieldChange('action', v as 'BUY' | 'SELL')}
            className="justify-start"
          >
            <ToggleGroupItem
              value="BUY"
              className="px-6 data-[state=on]:bg-success data-[state=on]:text-success-foreground"
            >
              BUY
            </ToggleGroupItem>
            <ToggleGroupItem
              value="SELL"
              className="px-6 data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground"
            >
              SELL
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Order Type Selection */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Order Type</Label>
          <ToggleGroup
            type="single"
            value={formState.orderType}
            onValueChange={(v) => v && onFieldChange('orderType', v as ManualTradingOrderType)}
            className="justify-start"
          >
            <ToggleGroupItem
              value="LIMIT"
              className="px-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              LIMIT
            </ToggleGroupItem>
            <ToggleGroupItem
              value="MARKET"
              className="px-6 data-[state=on]:bg-warning data-[state=on]:text-warning-foreground"
            >
              MARKET
            </ToggleGroupItem>
          </ToggleGroup>
          {formState.orderType === 'MARKET' && (
            <p className="text-xs text-warning">
              ⚠️ Market orders execute immediately at best available price
            </p>
          )}
        </div>

        {/* Shares / Notional Toggle */}
        <div className="flex items-center gap-3 py-2">
          <Switch
            id="use-notional"
            checked={formState.useNotional}
            onCheckedChange={(checked) => onFieldChange('useNotional', checked)}
          />
          <Label htmlFor="use-notional" className="text-sm cursor-pointer">
            Specify USD amount instead of shares
          </Label>
        </div>

        {/* Shares Input */}
        {!formState.useNotional ? (
          <div className="space-y-2">
            <Label htmlFor="shares" className="text-xs text-muted-foreground">
              Shares
            </Label>
            <Input
              id="shares"
              type="number"
              min="1"
              step="1"
              placeholder="e.g., 20"
              value={formState.shares}
              onChange={(e) => onFieldChange('shares', e.target.value)}
              className={validationErrors.shares ? 'border-destructive' : ''}
            />
            {validationErrors.shares && (
              <p className="text-xs text-destructive">{validationErrors.shares}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="notional" className="text-xs text-muted-foreground">
              Spend USD
            </Label>
            <Input
              id="notional"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g., 10.00"
              value={formState.notionalUsd}
              onChange={(e) => onFieldChange('notionalUsd', e.target.value)}
              className={validationErrors.notionalUsd ? 'border-destructive' : ''}
            />
            {validationErrors.notionalUsd && (
              <p className="text-xs text-destructive">{validationErrors.notionalUsd}</p>
            )}
            {estimatedShares !== null && currentAsk !== null && (
              <p className="text-xs text-muted-foreground">
                Est. ~{estimatedShares.toFixed(1)} shares @ {currentAsk.toFixed(3)} ask
              </p>
            )}
          </div>
        )}

        {/* Limit Price - Only for LIMIT orders */}
        {formState.orderType === 'LIMIT' && (
          <div className="space-y-2">
            <Label htmlFor="limitPrice" className="text-xs text-muted-foreground">
              Limit Price <span className="text-muted-foreground/70">(0.01 - 0.99)</span>
            </Label>
            <Input
              id="limitPrice"
              type="number"
              min="0.01"
              max="0.99"
              step="0.001"
              placeholder="e.g., 0.42"
              value={formState.limitPrice}
              onChange={(e) => onFieldChange('limitPrice', e.target.value)}
              className={validationErrors.limitPrice ? 'border-destructive' : ''}
            />
            {validationErrors.limitPrice && (
              <p className="text-xs text-destructive">{validationErrors.limitPrice}</p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={onSubmit}
          disabled={!canSubmit || isTradingDisabled}
          className="w-full h-11"
          variant={formState.action === 'BUY' ? 'default' : 'destructive'}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>Submit {formState.orderType} {formState.action} Order</>
          )}
        </Button>

        {/* Submit feedback */}
        {submitError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">{submitError}</AlertDescription>
          </Alert>
        )}
        {submitSuccess && (
          <Alert className="bg-success/10 border-success/30">
            <Check className="h-4 w-4 text-success" />
            <AlertDescription className="text-success text-sm">
              Order submitted successfully!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
