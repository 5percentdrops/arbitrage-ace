import { Activity, Zap, Shield } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Hooks
import { useBotState } from '@/hooks/useBotState';
import { useApiConnection } from '@/hooks/useApiConnection';
import { useRpcConnection } from '@/hooks/useRpcConnection';
import { useOpportunities } from '@/hooks/useOpportunities';
import { usePositions } from '@/hooks/usePositions';

// Components
import { ApiConfigPanel } from '@/components/config/ApiConfigPanel';
import { RpcConfigPanel } from '@/components/config/RpcConfigPanel';
import { BotControlPanel } from '@/components/bot/BotControlPanel';
import { TokenSelector } from '@/components/settings/TokenSelector';
import { FiltersPanel } from '@/components/settings/FiltersPanel';
import { CompoundingControls } from '@/components/settings/CompoundingControls';
import { ExitLogicPanel } from '@/components/settings/ExitLogicPanel';
import { OpportunitiesTable } from '@/components/trading/OpportunitiesTable';
import { PerformancePanel } from '@/components/trading/PerformancePanel';
import { PositionsTable } from '@/components/trading/PositionsTable';

const Index = () => {
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
    getPreflightChecks,
    canStartBot,
  } = useBotState();

  // API connection
  const {
    config: apiConfig,
    isTesting: isTestingApi,
    updateCredentials,
    testConnection: testApiConnection,
    disconnect: disconnectApi,
  } = useApiConnection();

  // RPC connection
  const {
    rpcConfig,
    walletConfig,
    isTesting: isTestingRpc,
    updateRpcUrl,
    updatePrivateKey,
    testRpcConnection,
    disconnectRpc,
  } = useRpcConnection();

  // Opportunities tracking
  const { opportunities, isLoading: isLoadingOpps, lastRefresh } = useOpportunities({
    tokens: state.selectedTokens,
    filters: state.filters,
    isRunning: state.status === 'running',
  });

  // Positions tracking
  const { positions, performance, closePosition, isLoading: isLoadingPositions } = usePositions({
    isRunning: state.status === 'running',
  });

  // Handlers
  const handleStart = () => {
    if (canStartBot()) {
      startBot();
      toast.success('Bot started successfully', {
        description: 'Scanning for arbitrage opportunities...',
      });
    } else {
      toast.error('Cannot start bot', {
        description: 'Please complete all preflight checks first.',
      });
    }
  };

  const handleStop = () => {
    stopBot();
    toast.info('Bot stopping', {
      description: 'Waiting for open operations to complete...',
    });
  };

  const handleEmergencyStop = () => {
    emergencyStop();
    toast.warning('Emergency stop activated', {
      description: 'All operations halted immediately.',
    });
  };

  const handleApiTest = async () => {
    const success = await testApiConnection();
    if (success) {
      toast.success('API connected', {
        description: 'Polymarket API connection established.',
      });
    } else {
      toast.error('API connection failed', {
        description: 'Check your credentials and try again.',
      });
    }
  };

  const handleRpcTest = async () => {
    const success = await testRpcConnection();
    if (success) {
      toast.success('RPC connected', {
        description: `Connected to Polygon network.`,
      });
    } else {
      toast.error('RPC connection failed', {
        description: 'Check your RPC URL and try again.',
      });
    }
  };

  // Get preflight checks with live connection status
  const preflightChecks = [
    {
      id: 'api',
      label: 'API Connected',
      passed: apiConfig.status === 'connected',
      message: apiConfig.status !== 'connected' ? 'Polymarket API not connected' : undefined,
    },
    {
      id: 'rpc',
      label: 'RPC Connected',
      passed: rpcConfig.status === 'connected',
      message: rpcConfig.status !== 'connected' ? 'Polygon RPC not connected' : undefined,
    },
    {
      id: 'wallet',
      label: 'Wallet Configured',
      passed: !!walletConfig.address,
      message: !walletConfig.address ? 'Wallet not configured' : undefined,
    },
    {
      id: 'funded',
      label: 'Wallet Funded',
      passed: walletConfig.usdcBalance > 0,
      message: walletConfig.usdcBalance <= 0 ? 'Wallet has no USDC balance' : undefined,
    },
    {
      id: 'tokens',
      label: 'Tokens Selected',
      passed: state.selectedTokens.length > 0,
      message: state.selectedTokens.length === 0 ? 'No tokens selected for scanning' : undefined,
    },
  ];

  const allChecksPass = preflightChecks.every((check) => check.passed);

  return (
    <div className="min-h-screen bg-background terminal-scanlines terminal-vignette terminal-flicker">
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
              {/* Connection Status Indicators */}
              <div className="hidden sm:flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      apiConfig.status === 'connected'
                        ? 'bg-success glow-success'
                        : apiConfig.status === 'connecting'
                        ? 'bg-warning animate-pulse'
                        : 'bg-muted-foreground'
                    }`}
                  />
                  <span className="text-muted-foreground">API</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      rpcConfig.status === 'connected'
                        ? 'bg-success glow-success'
                        : rpcConfig.status === 'connecting'
                        ? 'bg-warning animate-pulse'
                        : 'bg-muted-foreground'
                    }`}
                  />
                  <span className="text-muted-foreground">RPC</span>
                </div>
              </div>

              {/* Bot Status */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  state.status === 'running'
                    ? 'bg-success/20 text-success border border-success/30'
                    : state.status === 'starting' || state.status === 'stopping'
                    ? 'bg-warning/20 text-warning border border-warning/30'
                    : 'bg-secondary text-muted-foreground border border-border'
                }`}
              >
                <Activity
                  className={`h-3 w-3 ${
                    state.status === 'running' ? 'animate-pulse' : ''
                  }`}
                />
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
            <BotControlPanel
              status={state.status}
              availableCapital={state.availableCapital}
              lockedCapital={state.lockedCapital}
              activeMarkets={positions.length}
              lastTradeAt={state.lastTradeAt}
              compoundingEnabled={state.compounding.enabled}
              preflightChecks={preflightChecks}
              canStart={allChecksPass}
              onStart={handleStart}
              onStop={handleStop}
              onEmergencyStop={handleEmergencyStop}
              onToggleCompounding={(enabled) => updateCompounding({ enabled })}
            />

            {/* Compounding Controls - Priority #2 */}
            <CompoundingControls
              settings={state.compounding}
              onUpdate={updateCompounding}
              disabled={state.status === 'running'}
            />

            {/* Exit Logic - Priority #3 */}
            <ExitLogicPanel
              settings={state.exitSettings}
              onUpdate={updateExitSettings}
              disabled={state.status === 'running'}
            />

            {/* Token Selection */}
            <TokenSelector
              selectedTokens={state.selectedTokens}
              onToggle={toggleToken}
            />

            {/* Filters with Time Intervals */}
            <FiltersPanel filters={state.filters} onUpdate={updateFilters} />

            {/* API Configuration */}
            <ApiConfigPanel
              apiKey={apiConfig.apiKey}
              apiSecret={apiConfig.apiSecret}
              status={apiConfig.status}
              lastConnected={apiConfig.lastConnected}
              error={apiConfig.error}
              isTesting={isTestingApi}
              onCredentialsChange={updateCredentials}
              onTestConnection={handleApiTest}
              onDisconnect={disconnectApi}
            />

            {/* RPC Configuration */}
            <RpcConfigPanel
              rpcUrl={rpcConfig.rpcUrl}
              chainId={rpcConfig.chainId}
              rpcStatus={rpcConfig.status}
              blockNumber={rpcConfig.blockNumber}
              rpcError={rpcConfig.error}
              privateKey={walletConfig.privateKey}
              walletAddress={walletConfig.address}
              maticBalance={walletConfig.maticBalance}
              usdcBalance={walletConfig.usdcBalance}
              isTesting={isTestingRpc}
              onRpcUrlChange={updateRpcUrl}
              onPrivateKeyChange={updatePrivateKey}
              onTestConnection={handleRpcTest}
              onDisconnect={disconnectRpc}
            />
          </div>

          {/* Right Column - Data & Performance */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            {/* Performance Panel */}
            <PerformancePanel metrics={performance} />

            {/* Opportunities Table */}
            <OpportunitiesTable
              opportunities={opportunities}
              isLoading={isLoadingOpps}
              lastRefresh={lastRefresh}
            />

            {/* Positions Table */}
            <PositionsTable
              positions={positions}
              onClosePosition={closePosition}
              isLoading={isLoadingPositions}
            />
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
    </div>
  );
};

export default Index;
