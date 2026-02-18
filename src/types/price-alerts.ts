import type { TokenSymbol } from '@/types/trading';

export interface PriceAlertRule {
  id: string;
  asset: TokenSymbol;
  token: 'YES' | 'NO';
  condition: 'ABOVE' | 'BELOW';
  threshold: number; // in cents, e.g. 85 = 85¢
  notifyApp: boolean;
  notifyTelegram: boolean;
  enabled: boolean;
}
