
# Add Webhook URL Input Field to Settings

## What Changes

A new "Webhook" card section is added to the Settings page with a single input field where the user can paste a webhook URL to listen on. The value is persisted in localStorage alongside the other settings.

---

## File Changes

### `src/hooks/useSettings.ts`
- Add `webhookUrl: string` to the `SettingsState` interface
- Initialize it as `''` in `loadSettings()` defaults and `resetSettings()`

### `src/pages/Settings.tsx`
- Add a `Webhook` icon import from lucide-react
- Add a new Card section (between Telegram Alerts and Price Alerts) with:
  - Title: "Webhook Listener"
  - Description: "URL endpoint to receive incoming webhook signals"
  - Single text input for the webhook URL, placeholder like `https://example.com/webhook`
  - Helper text beneath

---

## UI After Change

```text
Signal Parameters   [card]
Telegram Alerts     [card]
Webhook Listener    [card]   <-- NEW
Price Alerts        [card]
```
