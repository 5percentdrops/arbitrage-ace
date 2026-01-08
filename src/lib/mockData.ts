import { 
  ArbitrageOpportunity, 
  OpenPosition, 
  PerformanceMetrics, 
  TokenSymbol,
  MarketTimeframe,
  OpportunityStatus,
  TOKENS 
} from '@/types/trading';

// Helper to generate random number in range
const randomInRange = (min: number, max: number) => 
  Math.random() * (max - min) + min;

const randomAsset = (): TokenSymbol => {
  return TOKENS[Math.floor(Math.random() * TOKENS.length)];
};

const TIMEFRAMES: MarketTimeframe[] = ['15m', '1h', '4h', 'daily'];

const randomTimeframe = (): MarketTimeframe => {
  return TIMEFRAMES[Math.floor(Math.random() * TIMEFRAMES.length)];
};

// Market name formats for crypto markets
const getMarketName = (asset: TokenSymbol, timeframe: MarketTimeframe): string => {
  const timeLabels: Record<MarketTimeframe, string> = {
    '15m': '15 Min',
    '1h': 'Hourly',
    '4h': '4 Hour',
    'daily': 'Daily'
  };
  return `${asset} ${timeLabels[timeframe]} UP/DOWN`;
};

// Generate mock arbitrage opportunities
export const generateMockOpportunities = (count: number = 15): ArbitrageOpportunity[] => {
  const statuses: OpportunityStatus[] = ['detected', 'executing', 'open', 'settled', 'missed'];

  return Array.from({ length: count }, (_, i) => {
    const asset = randomAsset();
    const timeframe = randomTimeframe();
    const marketName = getMarketName(asset, timeframe);
    
    // Generate combined price between 0.92 and 0.98 (valid arbitrage - buy YES+NO for < $1, redeem for $1)
    const combinedPrice = randomInRange(0.92, 0.98);
    const yesPrice = randomInRange(0.35, combinedPrice - 0.35);
    const noPrice = combinedPrice - yesPrice;
    const spreadPercent = (1 - combinedPrice) * 100;

    // Derive timeToSettlement from timeframe
    const timeRanges: Record<MarketTimeframe, [number, number]> = {
      '15m': [5, 15],
      '1h': [15, 60],
      '4h': [60, 240],
      'daily': [240, 1440]
    };
    const [minTime, maxTime] = timeRanges[timeframe];

    return {
      id: `opp-${Date.now()}-${i}`,
      token: asset,
      marketName,
      marketId: `market-${i}-${Date.now()}`,
      yesPrice: Number(yesPrice.toFixed(3)),
      noPrice: Number(noPrice.toFixed(3)),
      combinedPrice: Number(combinedPrice.toFixed(3)),
      spreadPercent: Number(spreadPercent.toFixed(2)),
      liquidity: Math.floor(randomInRange(15000, 500000)),
      volume24h: Math.floor(randomInRange(8000, 200000)),
      timeframe,
      timeToSettlement: Math.floor(randomInRange(minTime, maxTime)),
      status: statuses[Math.floor(Math.random() * 3)] as OpportunityStatus,
      detectedAt: new Date(Date.now() - Math.floor(randomInRange(0, 3600000))),
    };
  });
};

// Generate mock open positions
export const generateMockPositions = (count: number = 3): OpenPosition[] => {
  return Array.from({ length: count }, (_, i) => {
    const asset = TOKENS[i % TOKENS.length];
    const timeframe = randomTimeframe();
    const marketName = getMarketName(asset, timeframe);
    
    const leg1Shares = Math.floor(randomInRange(10, 50));
    const leg2Shares = Math.floor(randomInRange(10, 50));
    const leg1Locked = leg1Shares * randomInRange(0.4, 0.6);
    const leg1Filled = Math.random() > 0.3;
    
    // Tri-state for leg2Filled: 'yes', 'no', 'pending'
    let leg2Filled: 'yes' | 'no' | 'pending' = 'no';
    if (leg1Filled) {
      const rand = Math.random();
      if (rand < 0.4) leg2Filled = 'yes';
      else if (rand < 0.7) leg2Filled = 'pending';
    }

    return {
      id: `pos-${Date.now()}-${i}`,
      marketId: `market-pos-${i}`,
      marketName,
      token: asset,
      timeframe,
      leg1Shares,
      leg2Shares,
      leg1Locked: Number(leg1Locked.toFixed(2)),
      leg1Filled,
      leg2Filled,
      exitMode: Math.random() > 0.5 ? 'hold_to_settlement' : 'sell_at_threshold',
      openedAt: new Date(Date.now() - Math.floor(randomInRange(3600000, 86400000))),
    };
  });
};

// Generate mock performance metrics
export const generateMockPerformance = (): PerformanceMetrics => {
  const realizedPnl = randomInRange(50, 500);
  const unrealizedPnl = randomInRange(-20, 100);
  const dailyPnl = randomInRange(-10, 80);
  const totalPnl = realizedPnl + unrealizedPnl;
  const totalTrades = Math.floor(randomInRange(20, 100));
  const winRate = randomInRange(0.55, 0.85);

  return {
    realizedPnl: Number(realizedPnl.toFixed(2)),
    unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
    dailyPnl: Number(dailyPnl.toFixed(2)),
    totalPnl: Number(totalPnl.toFixed(2)),
    roiPercent: Number((totalPnl / 1000 * 100).toFixed(2)),
    totalTrades,
    winRate: Number((winRate * 100).toFixed(1)),
  };
};

// Simulate price updates (for live refresh)
export const updateOpportunityPrices = (
  opportunities: ArbitrageOpportunity[]
): ArbitrageOpportunity[] => {
  return opportunities.map(opp => {
    // Small random price fluctuation
    const yesDelta = (Math.random() - 0.5) * 0.02;
    const noDelta = (Math.random() - 0.5) * 0.02;
    
    const newYes = Math.max(0.01, Math.min(0.99, opp.yesPrice + yesDelta));
    const newNo = Math.max(0.01, Math.min(0.99, opp.noPrice + noDelta));
    const newCombined = newYes + newNo;
    const newSpread = (1 - newCombined) * 100;

    return {
      ...opp,
      yesPrice: Number(newYes.toFixed(3)),
      noPrice: Number(newNo.toFixed(3)),
      combinedPrice: Number(newCombined.toFixed(3)),
      spreadPercent: Number(newSpread.toFixed(2)),
      timeToSettlement: Math.max(0, opp.timeToSettlement - 1),
    };
  });
};

// Simulate deriving wallet address from private key
export const deriveWalletAddress = (privateKey: string): string | null => {
  if (!privateKey || privateKey.length < 64) return null;
  // Mock address generation
  const hash = privateKey.slice(0, 40);
  return `0x${hash.padEnd(40, '0')}`;
};

// Format time remaining
export const formatTimeRemaining = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
};

// Format currency
export const formatCurrency = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Format large numbers
export const formatNumber = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};
