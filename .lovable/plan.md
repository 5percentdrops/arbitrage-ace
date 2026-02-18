
# Price Alert System — In-App & Telegram Notifications

## Overview

Add a configurable price alert system where you define rules like "BTC YES price above 85¢" and get notified via an in-app toast and a Telegram message when the live market price crosses that threshold.

## How It Works

```text
Live WebSocket prices (MarketSnapshot)
         │
         ▼
  usePriceAlertMonitor
  - checks each rule every tick
  - 60-second cooldown per rule (no spam)
         │
    ┌────┴────┐
    │         │
  Toast    Telegram Bot API
  (app)    (fetch to api.telegram.org)
```

Telegram messages are sent directly from the browser to the Telegram Bot API using your bot token and chat ID — no backend required.

## New Files

### `src/types/price-alerts.ts`
Defines the `PriceAlertRule` type:
```typescript
export interface PriceAlertRule {
  id: string;
  asset: 'BTC' | 'ETH' | 'SOL' | 'XRP';
  token: 'YES' | 'NO';            // which price to watch
  condition: 'ABOVE' | 'BELOW';   // crossing direction
  threshold: number;              // in cents, e.g. 85
  notifyApp: boolean;
  notifyTelegram: boolean;
  enabled: boolean;
}
```

### `src/hooks/usePriceAlertMonitor.ts`
Runs on every market snapshot tick:
- Looks up the correct price (`yesAsk` for YES, `noAsk` for NO)
- Checks each enabled rule against the current price
- Uses a `lastTriggered` ref map to enforce a 60-second cooldown per rule
- Fires a `toast` for in-app notification
- Calls `https://api.telegram.org/bot{TOKEN}/sendMessage` for Telegram notification

### `src/components/settings/PriceAlertsPanel.tsx`
UI card for managing alert rules:
- Displays existing rules as rows: `BTC YES > 85¢ [App ✓] [TG ✓] [Delete]`
- "Add Alert" inline form: Asset dropdown, YES/NO toggle, ABOVE/BELOW select, threshold input (cents), app/telegram checkboxes
- Alerts stored in `localStorage` via `useSettings`

## Modified Files

### `src/hooks/useSettings.ts`
Add two new fields:
- `telegramBotToken: string` — your Telegram bot token (from @BotFather)
- `priceAlertRules: PriceAlertRule[]` — array of configured rules

### `src/pages/Settings.tsx`
- Add a masked **Bot Token** input (with show/hide eye toggle) to the existing Telegram Alerts section
- Add the new `PriceAlertsPanel` component below the Telegram section

### `src/pages/Index.tsx`
- Import and call `usePriceAlertMonitor`, passing:
  - `manualTrading.marketSnapshot` (already available)
  - `roundTimer.asset` (current asset)
  - `settings.priceAlertRules`
  - `settings.telegramBotToken` + `settings.telegramChatId`

## Final Settings Page Layout

```text
┌─────────────────────────────────────────────────┐
│ ⚙️ Signal Parameters                            │
│  Crowd Probability (%)  |  Remaining Time (sec) │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 📱 Telegram Alerts                              │
│  Bot Token  [•••••••••••••••]  👁️              │
│  Chat / Channel ID  [-10012345678]              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🔔 Price Alerts                                 │
│ ─────────────────────────────────────────────── │
│  BTC  YES  >  85¢   [App ✓]  [TG ✓]  [Delete] │
│  ETH  NO   <  30¢   [App ✓]  [TG –]  [Delete] │
│ ─────────────────────────────────────────────── │
│  + Add Alert                                    │
│  [Asset ▾] [YES/NO] [>/<] [__¢] [App] [TG] [+] │
└─────────────────────────────────────────────────┘
```

## Alert Notification Examples

**In-app toast:**
> 🔔 BTC YES hit 86¢ — above your 85¢ alert

**Telegram message:**
> 🔔 Price Alert: BTC YES is now 86¢ (above threshold of 85¢)

## Files Changed

| File | Action |
|------|--------|
| `src/types/price-alerts.ts` | Create — PriceAlertRule type |
| `src/hooks/usePriceAlertMonitor.ts` | Create — monitoring + notification logic |
| `src/components/settings/PriceAlertsPanel.tsx` | Create — settings UI |
| `src/hooks/useSettings.ts` | Update — add `telegramBotToken`, `priceAlertRules` |
| `src/pages/Settings.tsx` | Update — bot token field + PriceAlertsPanel |
| `src/pages/Index.tsx` | Update — wire up usePriceAlertMonitor |

## Technical Notes

- The Telegram Bot API call is a simple `fetch` with no backend needed: `POST https://api.telegram.org/bot{TOKEN}/sendMessage`
- Bot token is stored in `localStorage` (same as API keys in this app). It is masked in the UI.
- 60-second cooldown per rule prevents notification spam when a price hovers at the threshold
- Cooldown resets if the price moves away and crosses back — so repeated real crossings still alert
