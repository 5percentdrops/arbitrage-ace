import { 
  ArbitrageOpportunity, 
  OpenPosition, 
  PerformanceMetrics, 
  TokenSymbol,
  OpportunityStatus,
  TOKENS 
} from '@/types/trading';

// Helper to generate random number in range
const randomInRange = (min: number, max: number) => 
  Math.random() * (max - min) + min;

const randomAsset = (): TokenSymbol => {
  return TOKENS[Math.floor(Math.random() * TOKENS.length)];
};

// Market name formats for daily UP/DOWN crypto markets
const getMarketName = (asset: TokenSymbol): string => {
  const formats = [
    `${asset} Daily UP/DOWN`,
    `${asset} 24h Direction`,
    `${asset} Price Movement Today`,
    `Will ${asset} go UP today?`,
  ];
  return formats[Math.floor(Math.random() * formats.length)];
};

// Generate mock arbitrage opportunities
export const generateMockOpportunities = (count: number = 15): ArbitrageOpportunity[] => {
  const statuses: OpportunityStatus[] = ['detected', 'executing', 'open', 'settled', 'missed'];

  return Array.from({ length: count }, (_, i) => {
    const asset = randomAsset();
    const marketName = getMarketName(asset);
    
    // Generate combined price between 0.92 and 0.98 (valid arbitrage - buy YES+NO for < $1, redeem for $1)
    const combinedPrice = randomInRange(0.92, 0.98);
    const yesPrice = randomInRange(0.35, combinedPrice - 0.35);
    const noPrice = combinedPrice - yesPrice;
    const spreadPercent = (1 - combinedPrice) * 100;

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
      timeToSettlement: Math.floor(randomInRange(30, 1200)),
      status: statuses[Math.floor(Math.random() * 3)] as OpportunityStatus,
      detectedAt: new Date(Date.now() - Math.floor(randomInRange(0, 3600000))),
    };
  });
};

// Generate mock open positions
export const generateMockPositions = (count: number = 3): OpenPosition[] => {
  return Array.from({ length: count }, (_, i) => {
    const asset = TOKENS[i % TOKENS.length];
    const marketName = getMarketName(asset);
    
    // Generate YES and NO entry prices that sum to < $1.00 for arbitrage profit
    const combinedPrice = randomInRange(0.92, 0.98);
    const yesEntryPrice = randomInRange(0.35, combinedPrice - 0.35);
    const noEntryPrice = combinedPrice - yesEntryPrice;
    
    const shares = Math.floor(randomInRange(50, 200));
    const entryCost = shares * combinedPrice;
    const lockedCapital = shares * 1.00; // Max payout at $1 per share pair
    const unrealizedPnl = lockedCapital - entryCost; // Profit if held to settlement

    return {
      id: `pos-${Date.now()}-${i}`,
      marketId: `market-pos-${i}`,
      marketName,
      token: asset,
      yesEntryPrice: Number(yesEntryPrice.toFixed(3)),
      noEntryPrice: Number(noEntryPrice.toFixed(3)),
      shares,
      entryCost: Number(entryCost.toFixed(2)),
      lockedCapital: Number(lockedCapital.toFixed(2)),
      exitMode: Math.random() > 0.5 ? 'hold_to_settlement' : 'sell_at_threshold',
      timeRemaining: Math.floor(randomInRange(30, 720)),
      unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
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
