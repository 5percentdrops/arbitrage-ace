

# Simplify Settings Page

## Overview
Streamline the Settings page to only keep:
1. **Signal Parameters** - Crowd Probability and Remaining Time inputs
2. **Telegram Alerts** - Only the Chat/Channel ID input (remove CVD toggle)

Remove the Webhook URLs section entirely.

## Changes

### File: `src/hooks/useSettings.ts`

**Remove fields:**
- `webhook1`, `webhook2`, `webhook3`
- `cvdEnabled`

**Keep fields:**
- `crowdPct`
- `remainingTime`
- `telegramChatId`

### File: `src/pages/Settings.tsx`

**Remove:**
- Entire Webhook URLs Card section
- CVD toggle from Telegram Alerts section
- `Webhook` icon import

**Keep:**
- Signal Parameters section (Crowd % and Remaining Time)
- Telegram Alerts section (only Chat/Channel ID input)

## Final UI Layout

```text
┌─────────────────────────────────────────────────┐
│ ⚙️ Settings                           [Reset]   │
│ Configure signal parameters and webhooks        │
├─────────────────────────────────────────────────┤
│                                                 │
│ 👥 Signal Parameters                            │
│ Configure crowd probability and timing          │
│                                                 │
│  Crowd Probability (%)    Remaining Time (sec)  │
│  ┌─────────────────┐      ┌─────────────────┐  │
│  │ 67              │      │ 420             │  │
│  └─────────────────┘      └─────────────────┘  │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📱 Telegram Alerts                              │
│ Configure incoming alerts from Telegram         │
│                                                 │
│  Telegram Chat/Channel ID                       │
│  ┌───────────────────────────────────────┐     │
│  │ -1001234567890                        │     │
│  └───────────────────────────────────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Files Changed

| File | Changes |
|------|---------|
| `src/hooks/useSettings.ts` | Remove `webhook1`, `webhook2`, `webhook3`, `cvdEnabled` from interface, defaults, and reset |
| `src/pages/Settings.tsx` | Remove Webhook section and CVD toggle, keep Signal and Telegram Chat ID |

## Updated Settings Interface

```typescript
export interface SettingsState {
  // Signal settings
  crowdPct: string;
  remainingTime: string;
  // Telegram Alerts
  telegramChatId: string;
}
```

