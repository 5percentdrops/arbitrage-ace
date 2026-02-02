// Polymarket Asset ID Configuration
// Maps trading assets to their YES/NO token IDs on Polymarket

import type { TokenSymbol } from '@/types/trading';

export interface PolymarketAsset {
  yesTokenId: string;
  noTokenId: string;
  conditionId: string;
  marketSlug: string;
}

// These are example token IDs - they should be updated with actual market IDs
// Token IDs can be found via the Polymarket API or market pages
export const POLYMARKET_ASSETS: Record<TokenSymbol, PolymarketAsset> = {
  BTC: {
    // BTC Up/Down 15min market tokens (example IDs - update with real ones)
    yesTokenId: '21742633143463906290569050155826241533067272736897614950488156847949938836455',
    noTokenId: '48331043336612883890938759509493159234755048973500640148014422747788308965732',
    conditionId: '0x1234567890abcdef',
    marketSlug: 'btc-up-15min',
  },
  ETH: {
    yesTokenId: '52114319501245915516055106046884209969926127482827954674443846427813813222426',
    noTokenId: '71321433068543984649695897897456787877877986786756755788454565655655656565756',
    conditionId: '0x2345678901bcdef0',
    marketSlug: 'eth-up-15min',
  },
  SOL: {
    yesTokenId: '63225430612356026627166217157995320080037238593938065785554957538924924333537',
    noTokenId: '82432544179654095760277328268106431191148349704049176896665068649035035444648',
    conditionId: '0x3456789012cdef01',
    marketSlug: 'sol-up-15min',
  },
  XRP: {
    yesTokenId: '74336541723467137738277328379216542302259460815150287907776179760146146555759',
    noTokenId: '93543655290765206871388439490327653413370571926261398018887290871257257666860',
    conditionId: '0x456789023def0123',
    marketSlug: 'xrp-up-15min',
  },
} as const;

/**
 * Get asset IDs for WebSocket subscription
 */
export function getAssetIds(asset: TokenSymbol): [string, string] {
  const config = POLYMARKET_ASSETS[asset];
  return [config.yesTokenId, config.noTokenId];
}

/**
 * Get market slug for an asset
 */
export function getMarketSlug(asset: TokenSymbol): string {
  return POLYMARKET_ASSETS[asset].marketSlug;
}
