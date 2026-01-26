import { useState } from 'react';
import { Zap, Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { AutoLadder } from '@/components/trading/auto/AutoLadder';
import { useRoundTimer } from '@/hooks/useRoundTimer';

const AutoTrading = () => {
  const roundTimer = useRoundTimer('BTC');

  return (
    <div className="min-h-screen bg-background terminal-scanlines terminal-vignette terminal-flicker">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Auto Trading Ladder</h1>
                <p className="text-xs text-muted-foreground">Side-by-side YES/NO Order Book</p>
              </div>
            </div>

            {/* Right - Back button */}
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
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
  );
};

export default AutoTrading;
