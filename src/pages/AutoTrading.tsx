import { Shield } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { TradingLayout } from '@/components/layout/TradingLayout';
import { AutoLadder } from '@/components/trading/auto/AutoLadder';
import { useRoundTimer } from '@/hooks/useRoundTimer';

const AutoTrading = () => {
  const roundTimer = useRoundTimer('BTC');

  return (
    <TradingLayout>
      <div className="flex-1 bg-background terminal-scanlines terminal-vignette terminal-flicker">
        <Toaster position="top-right" richColors />
        
        {/* Header Bar */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-10 z-40">
          <div className="container mx-auto px-4 py-3">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Order Ladder</h1>
              <p className="text-xs text-muted-foreground">Side-by-side YES/NO Order Book</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          <AutoLadder 
            asset={roundTimer.asset} 
            marketId={`market-${roundTimer.asset.toLowerCase()}-15m`} 
          />
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
    </TradingLayout>
  );
};

export default AutoTrading;
