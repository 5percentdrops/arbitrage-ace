import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { useDecisionAlerts } from '@/hooks/useDecisionAlerts';
import { DecisionAlertCard } from '@/components/alerts/DecisionAlertCard';
import { DecisionAlertsSkeleton } from '@/components/alerts/DecisionAlertsSkeleton';
import type { AlertAsset } from '@/types/decision-alerts';

type AssetFilter = AlertAsset | 'ALL';

export default function DecisionAlerts() {
  const [assetFilter, setAssetFilter] = useState<AssetFilter>('ALL');
  
  const {
    alerts,
    isLoading,
    error,
    autoRefresh,
    setAutoRefresh,
    fetchAlerts,
    executeAction,
    isActionInFlight
  } = useDecisionAlerts({ assetFilter, autoRefresh: true });

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
            
            <Link 
              to="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 terminal-grid">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Decision Alerts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Polymarket 15m Up/Down — entries only when ≥ 5:00 remaining
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Asset Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Asset:</Label>
            <Select value={assetFilter} onValueChange={(v) => setAssetFilter(v as AssetFilter)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="BTC">BTC</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
                <SelectItem value="SOL">SOL</SelectItem>
                <SelectItem value="XRP">XRP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto-refresh Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm text-muted-foreground">
              Auto-refresh
            </Label>
          </div>

          {/* Manual Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            disabled={isLoading || isActionInFlight}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Alert count */}
          {!isLoading && !error && (
            <span className="text-sm text-muted-foreground ml-auto">
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''} ready
            </span>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAlerts}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <DecisionAlertsSkeleton />
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Zap className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg">No READY decision alerts right now</p>
            <p className="text-sm mt-1">Alerts will appear when opportunities are detected</p>
          </div>
        ) : (
          <div className="relative px-12">
            <Carousel opts={{ loop: true }} className="w-full">
              <CarouselContent>
                {alerts.map((alert) => (
                  <CarouselItem key={alert.id}>
                    <DecisionAlertCard
                      alert={alert}
                      onAction={executeAction}
                      isActionInFlight={isActionInFlight}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
            
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Swipe or use arrows to navigate • {alerts.length} alerts
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Decision Alerts • Polymarket 15m Cycles</span>
            <span>Auto-refresh: {autoRefresh ? 'ON (3s)' : 'OFF'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
