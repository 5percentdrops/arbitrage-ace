

# Add CVD Toggle and Telegram Channel Input to Settings

## Overview
Add a simple Telegram Alerts section with:
1. A CVD toggle switch (on/off) to enable/disable CVD-based alerts
2. A Telegram chat/channel ID input field to specify where to listen for alerts

## Visual Design

```text
┌─────────────────────────────────────────────────┐
│ 📱 Telegram Alerts                              │
│ Configure incoming alerts from Telegram         │
├─────────────────────────────────────────────────┤
│                                                 │
│  CVD Alerts                                     │
│  Enable CVD divergence signals      [  ON  ]   │
│                                                 │
│  Telegram Chat/Channel ID                       │
│  ┌───────────────────────────────────────┐     │
│  │ -1001234567890                        │     │
│  └───────────────────────────────────────┘     │
│  The chat or channel ID to listen for alerts   │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Implementation

### File: `src/hooks/useSettings.ts`

**Changes:**
1. Add `cvdEnabled` (boolean) to `SettingsState`
2. Add `telegramChatId` (string) to `SettingsState`
3. Update defaults and reset function

```typescript
export interface SettingsState {
  // ... existing fields
  // Telegram Alerts
  cvdEnabled: boolean;
  telegramChatId: string;
}
```

### File: `src/pages/Settings.tsx`

**Changes:**
1. Import `MessageCircle` icon and `Switch` component
2. Add new "Telegram Alerts" Card section after Webhooks
3. CVD toggle using Switch component
4. Telegram Chat/Channel ID text input

## Files Changed

| File | Changes |
|------|---------|
| `src/hooks/useSettings.ts` | Add `cvdEnabled` and `telegramChatId` fields |
| `src/pages/Settings.tsx` | Add Telegram Alerts section with CVD toggle and chat ID input |

## New Settings Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `cvdEnabled` | boolean | `false` | Toggle CVD divergence alerts on/off |
| `telegramChatId` | string | `''` | Telegram chat/channel ID to monitor |

