import { useState, useEffect, useRef, useCallback } from 'react';
import type { TokenSymbol } from '@/types/trading';
import { cn } from '@/lib/utils';
import { Activity, Shield, Bell, Clock } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Hooks
import { useBotState } from '@/hooks/useBotState';
import { useApiConnection } from '@/hooks/useApiConnection';
import { useOrderHistory } from '@/hooks/useOrderHistory';
import { usePositions } from '@/hooks/usePositions';
import { useRoundTimer } from '@/hooks/useRoundTimer';
import { useManualTrading } from '@/hooks/useManualTrading';
import { useDecisionAlerts } from '@/hooks/useDecisionAlerts';

// Components
import { TradingLayout } from '@/components/layout/TradingLayout';
import { ApiConfigPanel } from '@/components/config/ApiConfigPanel';
import { FiltersPanel } from '@/components/settings/FiltersPanel';
import { ExitLogicPanel } from '@/components/settings/ExitLogicPanel';
import { OrderHistoryTable } from '@/components/trading/OrderHistoryTable';
import { PerformancePanel } from '@/components/trading/PerformancePanel';
import { PositionsTable } from '@/components/trading/PositionsTable';
import { RoundTimerCard } from '@/components/trading/RoundTimerCard';
import { TradingTabs } from '@/components/trading/TradingTabs';
import { DecisionAlertNotification } from '@/components/alerts/DecisionAlertNotification';

const Index = () => {
  // Decision Alerts notification state
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const {
    alerts: decisionAlerts,
    executeAction: executeAlertAction,
    isActionInFlight: isAlertActionInFlight
  } = useDecisionAlerts({ assetFilter: 'ALL', autoRefresh: true });

  // Always show notification when we have (demo or real) alerts
  useEffect(() => {
    if (decisionAlerts.length > 0) setIsAlertVisible(true);
  }, [decisionAlerts.length]);

  // Ref for Round Timer card to detect when it's out of view
  const roundTimerRef = useRef<HTMLDivElement>(null);
  const [isTimerOutOfView, setIsTimerOutOfView] = useState(false);

  useEffect(() => {
    const timerElement = roundTimerRef.current;
    if (!timerElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsTimerOutOfView(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );

    observer.observe(timerElement);
    return () => observer.disconnect();
  }, []);

  // Bot state management
  const {
    state,
    startBot,
    stopBot,
    emergencyStop,
    updateFilters,
    updateExitSettings,
    updatePositionSizeSettings,
    getPreflightChecks,
    canStartBot
  } = useBotState();

  // API connection
  const {
    config: apiConfig,
    isTesting: isTestingApi,
    updateCredentials,
    testConnection: testApiConnection,
    disconnect: disconnectApi
  } = useApiConnection();

  // Order history tracking
  const {
    orders,
    isLoading: isLoadingOrders,
    lastRefresh
  } = useOrderHistory({
    isRunning: state.status === 'running'
  });

  // Positions tracking
  const {
    positions,
    performance,
    closePosition,
    isLoading: isLoadingPositions
  } = usePositions({
    isRunning: state.status === 'running'
  });

  // Round Timer
  const roundTimer = useRoundTimer('BTC');

  // Manual Trading
  const manualTrading = useManualTrading({
    isBotRunning: state.status === 'running'
  });

  // Handler to pre-fill manual trade from alert
  const handlePreFillManualTrade = useCallback((asset: string, outcome: 'YES' | 'NO', action: 'BUY' | 'SELL') => {
    manualTrading.updateField('asset', asset as TokenSymbol);
    manualTrading.updateField('outcome', outcome);
    manualTrading.updateField('action', action);
    manualTrading.updateField('orderType', 'MARKET');
  }, [manualTrading]);

  // Handlers
  const handleStart = () => {
    if (canStartBot()) {
      startBot();
      toast.success('Bot started successfully', {
        description: 'Scanning for arbitrage opportunities...'
      });
    } else {
      toast.error('Cannot start bot', {
        description: 'Please complete all preflight checks first.'
      });
    }
  };
  const handleStop = () => {
    stopBot();
    toast.info('Bot stopping', {
      description: 'Waiting for open operations to complete...'
    });
  };
  const handleEmergencyStop = () => {
    emergencyStop();
    toast.warning('Emergency stop activated', {
      description: 'All operations halted immediately.'
    });
  };
  const handleApiTest = async () => {
    const success = await testApiConnection();
    if (success) {
      toast.success('API connected', {
        description: 'Polymarket API connection established.'
      });
    } else {
      toast.error('API connection failed', {
        description: 'Check your credentials and try again.'
      });
    }
  };

  // Get preflight checks with live connection status
  const preflightChecks = [{
    id: 'api',
    label: 'API Connected',
    passed: apiConfig.status === 'connected',
    message: apiConfig.status !== 'connected' ? 'Polymarket API not connected' : undefined
  }, {
    id: 'tokens',
    label: 'Tokens Selected',
    passed: state.selectedTokens.length > 0,
    message: state.selectedTokens.length === 0 ? 'No tokens selected for scanning' : undefined
  }];
  const allChecksPass = preflightChecks.every(check => check.passed);

  return (
    <TradingLayout>
      <div className="flex-1 bg-background terminal-scanlines terminal-vignette terminal-flicker">
        <Toaster position="top-right" richColors />
        
        {/* Header Bar */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-10 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between relative">
              {/* Left - Title */}
              <div>
                <h1 className="text-lg font-bold tracking-tight">Manual Trading</h1>
                <p className="text-xs text-muted-foreground">Polymarket Up/Down Scanner</p>
              </div>

              {/* Center - Sticky Timer */}
              <div className={cn(
                "absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300",
                isTimerOutOfView 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 -translate-y-2 pointer-events-none',
                roundTimer.secondsRemaining <= 300 
                  ? 'bg-destructive/10 border-destructive/30' 
                  : roundTimer.isJustStarted 
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-card border-border'
              )}>
                <Clock className="h-5 w-5 text-primary" />
                <span className={cn(
                  "font-mono font-bold tracking-wider text-4xl",
                  roundTimer.secondsRemaining <= 300 && "text-destructive drop-shadow-[0_0_8px_hsl(var(--destructive)/0.7)]",
                  roundTimer.isJustStarted && "text-primary"
                )}>
                  {Math.floor(roundTimer.secondsRemaining / 60).toString().padStart(2, '0')}:
                  {(roundTimer.secondsRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Right - Bell and Connection Status */}
              <div className="flex items-center gap-4">
                {/* Decision Alerts Bell */}
                <button 
                  onClick={() => setIsAlertVisible(true)}
                  className="relative flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Bell className="h-4 w-4" />
                  {decisionAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center animate-pulse">
                      {decisionAlerts.length}
                    </span>
                  )}
                </button>

                {/* Connection Status Indicators */}
                <div className="hidden sm:flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${apiConfig.status === 'connected' ? 'bg-success glow-success' : apiConfig.status === 'connecting' ? 'bg-warning animate-pulse' : 'bg-muted-foreground'}`} />
                    <span className="text-muted-foreground">API</span>
                  </div>
                </div>

                {/* Bot Status */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${state.status === 'running' ? 'bg-success/20 text-success border border-success/30' : state.status === 'starting' || state.status === 'stopping' ? 'bg-warning/20 text-warning border border-warning/30' : 'bg-secondary text-muted-foreground border border-border'}`}>
                  <Activity className={`h-3 w-3 ${state.status === 'running' ? 'animate-pulse' : ''}`} />
                  {state.status.charAt(0).toUpperCase() + state.status.slice(1)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 terminal-grid">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Controls & Configuration */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-4">
              <ExitLogicPanel settings={state.exitSettings} onUpdate={updateExitSettings} disabled={state.status === 'running'} />
              <FiltersPanel filters={state.filters} onUpdate={updateFilters} />
              <ApiConfigPanel apiKey={apiConfig.apiKey} apiSecret={apiConfig.apiSecret} status={apiConfig.status} lastConnected={apiConfig.lastConnected} error={apiConfig.error} isTesting={isTestingApi} onCredentialsChange={updateCredentials} onTestConnection={handleApiTest} onDisconnect={disconnectApi} />
            </div>

            {/* Right Column - Data & Performance */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-4">
              <PerformancePanel metrics={performance} />
              <div ref={roundTimerRef}>
                <RoundTimerCard
                  roundStart={roundTimer.roundStart}
                  roundEnd={roundTimer.roundEnd}
                  secondsRemaining={roundTimer.secondsRemaining}
                  progressPercent={roundTimer.progressPercent}
                  isJustStarted={roundTimer.isJustStarted}
                  syncStatus={roundTimer.syncStatus}
                  asset={roundTimer.asset}
                  onAssetChange={roundTimer.setAsset}
                  onRefresh={roundTimer.refresh}
                />
              </div>
              <TradingTabs
                formState={manualTrading.formState}
                onFieldChange={manualTrading.updateField}
                validationErrors={manualTrading.validationErrors}
                isValid={manualTrading.isValid}
                canSubmit={manualTrading.canSubmit}
                isSubmitting={manualTrading.isSubmitting}
                submitError={manualTrading.submitError}
                submitSuccess={manualTrading.submitSuccess}
                onSubmit={manualTrading.submitOrder}
                isBotRunning={state.status === 'running'}
                onToggleBot={(enabled) => enabled ? startBot() : stopBot()}
                allowManualWhileAuto={manualTrading.allowManualWhileAuto}
                onAllowManualChange={manualTrading.setAllowManualWhileAuto}
                estimatedShares={manualTrading.estimatedShares}
              />
              <PositionsTable positions={positions} onClosePosition={closePosition} isLoading={isLoadingPositions} />
              <OrderHistoryTable orders={orders} isLoading={isLoadingOrders} lastRefresh={lastRefresh} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card/30 mt-8">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span>Use at your own risk. This is a trading tool with real financial implications.</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Polygon Network</span>
                <span>•</span>
                <span>Polymarket Integration</span>
              </div>
            </div>
          </div>
        </footer>

        {/* Decision Alert Notification */}
        <DecisionAlertNotification
          alerts={decisionAlerts}
          isVisible={isAlertVisible}
          onVisibilityChange={setIsAlertVisible}
          onAction={executeAlertAction}
          isActionInFlight={isAlertActionInFlight}
          onPreFillManualTrade={handlePreFillManualTrade}
        />
      </div>
    </TradingLayout>
  );
};

export default Index;
