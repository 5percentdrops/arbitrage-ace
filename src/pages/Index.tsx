import { useState, useEffect } from 'react';
import { Activity, Zap, Shield, Bell, Clock } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Hooks
import { useBotState } from '@/hooks/useBotState';
import { useApiConnection } from '@/hooks/useApiConnection';
import { useRpcConnection } from '@/hooks/useRpcConnection';
import { useOrderHistory } from '@/hooks/useOrderHistory';
import { usePositions } from '@/hooks/usePositions';
import { useDumpHedge } from '@/hooks/useDumpHedge';
import { useRoundTimer } from '@/hooks/useRoundTimer';
import { useManualTrading } from '@/hooks/useManualTrading';
import { useDecisionAlerts } from '@/hooks/useDecisionAlerts';


// Components
import { ApiConfigPanel } from '@/components/config/ApiConfigPanel';
import { RpcConfigPanel } from '@/components/config/RpcConfigPanel';
import { BotControlPanel } from '@/components/bot/BotControlPanel';
import { TokenSelector } from '@/components/settings/TokenSelector';
import { FiltersPanel } from '@/components/settings/FiltersPanel';
import { CompoundingControls } from '@/components/settings/CompoundingControls';
import { ExitLogicPanel } from '@/components/settings/ExitLogicPanel';
import { PositionSizePanel } from '@/components/settings/PositionSizePanel';
import { DumpHedgePanel } from '@/components/trading/DumpHedgePanel';
import { OrderHistoryTable } from '@/components/trading/OrderHistoryTable';
import { PerformancePanel } from '@/components/trading/PerformancePanel';
import { PositionsTable } from '@/components/trading/PositionsTable';
import { RoundTimerCard } from '@/components/trading/RoundTimerCard';
import { ManualTradePanel } from '@/components/trading/ManualTradePanel';
import { DecisionAlertModal } from '@/components/alerts/DecisionAlertModal';

const Index = () => {
  // Decision Alerts modal state
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const {
    alerts: decisionAlerts,
    executeAction: executeAlertAction,
    isActionInFlight: isAlertActionInFlight
  } = useDecisionAlerts({ assetFilter: 'ALL', autoRefresh: true });
  // Scroll detection for sticky timer
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bot state management
  const {
    state,
    startBot,
    stopBot,
    emergencyStop,
    toggleToken,
    updateFilters,
    updateCompounding,
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

  // RPC connection
  const {
    rpcConfig,
    walletConfig,
    isTesting: isTestingRpc,
    updateRpcUrl,
    updatePrivateKey,
    testRpcConnection,
    disconnectRpc
  } = useRpcConnection();

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

  // Dump & Hedge strategy (independent of main bot)
  const {
    state: dumpHedgeState,
    toggleAutoMode: toggleDumpHedgeAutoMode,
    updateParams: updateDumpHedgeParams,
    getWarnings: getDumpHedgeWarnings
  } = useDumpHedge();

  // Round Timer
  const roundTimer = useRoundTimer('BTC');

  // Manual Trading
  const manualTrading = useManualTrading({
    isBotRunning: state.status === 'running'
  });


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
  const handleRpcTest = async () => {
    const success = await testRpcConnection();
    if (success) {
      toast.success('RPC connected', {
        description: `Connected to Polygon network.`
      });
    } else {
      toast.error('RPC connection failed', {
        description: 'Check your RPC URL and try again.'
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


  return <div className="min-h-screen bg-background terminal-scanlines terminal-vignette terminal-flicker">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Crypto Arbitrage Bot</h1>
                <p className="text-xs text-muted-foreground">Polymarket Up/Down Scanner</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Sticky Time Remaining - only visible when scrolled */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                isScrolled 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 -translate-y-2 pointer-events-none'
              } ${
                roundTimer.secondsRemaining <= 300 
                  ? 'bg-destructive/10 border-destructive/30 text-destructive animate-pulse' 
                  : roundTimer.isJustStarted 
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-card border-border text-foreground'
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono font-bold text-lg">
                  {Math.floor(roundTimer.secondsRemaining / 60).toString().padStart(2, '0')}:
                  {(roundTimer.secondsRemaining % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {roundTimer.asset}
                </span>
              </div>

              {/* Decision Alerts Bell */}
              <button 
                onClick={() => setIsAlertModalOpen(true)}
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
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${rpcConfig.status === 'connected' ? 'bg-success glow-success' : rpcConfig.status === 'connecting' ? 'bg-warning animate-pulse' : 'bg-muted-foreground'}`} />
                  
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
          {/* Left Column - Controls & Configuration (Priority at top) */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            {/* Bot Control - Priority #1 */}
            <BotControlPanel status={state.status} availableCapital={state.availableCapital} lockedCapital={state.lockedCapital} activeMarkets={positions.length} lastTradeAt={state.lastTradeAt} compoundingEnabled={state.compounding.enabled} preflightChecks={preflightChecks} canStart={allChecksPass} onStart={handleStart} onStop={handleStop} onEmergencyStop={handleEmergencyStop} onToggleCompounding={enabled => updateCompounding({
            enabled
          })} />

            {/* Position Size - Priority #2 */}
            <PositionSizePanel settings={state.positionSizeSettings} onUpdate={updatePositionSizeSettings} disabled={state.status === 'running'} />

            {/* Compounding Controls - Priority #3 */}
            <CompoundingControls settings={state.compounding} onUpdate={updateCompounding} disabled={state.status === 'running'} />

            {/* Exit Logic - Priority #3 */}
            <ExitLogicPanel settings={state.exitSettings} onUpdate={updateExitSettings} disabled={state.status === 'running'} />

            {/* Dump & Hedge Strategy (Optional) */}
            <DumpHedgePanel state={dumpHedgeState} onToggleAutoMode={toggleDumpHedgeAutoMode} onUpdateParams={updateDumpHedgeParams} warnings={getDumpHedgeWarnings()} />

            {/* Token Selection */}
            <TokenSelector selectedTokens={state.selectedTokens} onToggle={toggleToken} />

            {/* Filters with Time Intervals */}
            <FiltersPanel filters={state.filters} onUpdate={updateFilters} />

            {/* API Configuration */}
            <ApiConfigPanel apiKey={apiConfig.apiKey} apiSecret={apiConfig.apiSecret} status={apiConfig.status} lastConnected={apiConfig.lastConnected} error={apiConfig.error} isTesting={isTestingApi} onCredentialsChange={updateCredentials} onTestConnection={handleApiTest} onDisconnect={disconnectApi} />

            {/* RPC Configuration */}
            <RpcConfigPanel rpcUrl={rpcConfig.rpcUrl} chainId={rpcConfig.chainId} rpcStatus={rpcConfig.status} blockNumber={rpcConfig.blockNumber} rpcError={rpcConfig.error} privateKey={walletConfig.privateKey} walletAddress={walletConfig.address} maticBalance={walletConfig.maticBalance} usdcBalance={walletConfig.usdcBalance} isTesting={isTestingRpc} onRpcUrlChange={updateRpcUrl} onPrivateKeyChange={updatePrivateKey} onTestConnection={handleRpcTest} onDisconnect={disconnectRpc} />
          </div>

          {/* Right Column - Data & Performance */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            {/* Performance Panel */}
            <PerformancePanel metrics={performance} />

            {/* Round Timer */}
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

            {/* Manual Trading */}
            <ManualTradePanel
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
              allowManualWhileAuto={manualTrading.allowManualWhileAuto}
              onAllowManualChange={manualTrading.setAllowManualWhileAuto}
              estimatedShares={manualTrading.estimatedShares}
            />

            {/* Positions Table */}
            <PositionsTable positions={positions} onClosePosition={closePosition} isLoading={isLoadingPositions} />

            {/* Order History Table */}
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

      {/* Decision Alert Modal */}
      <DecisionAlertModal
        alerts={decisionAlerts}
        isOpen={isAlertModalOpen}
        onOpenChange={setIsAlertModalOpen}
        onAction={executeAlertAction}
        isActionInFlight={isAlertActionInFlight}
      />
    </div>;
};
export default Index;
