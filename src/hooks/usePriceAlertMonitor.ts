import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { MarketSnapshot } from '@/types/manual-trading';
import type { PriceAlertRule } from '@/types/price-alerts';

interface UsePriceAlertMonitorOptions {
  marketSnapshot: MarketSnapshot | null;
  rules: PriceAlertRule[];
  telegramBotToken: string;
  telegramChatId: string;
}

const COOLDOWN_MS = 60_000; // 60 seconds per rule

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  if (!botToken || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch (err) {
    console.error('[PriceAlertMonitor] Telegram send failed:', err);
  }
}

export function usePriceAlertMonitor({
  marketSnapshot,
  rules,
  telegramBotToken,
  telegramChatId,
}: UsePriceAlertMonitorOptions) {
  // Map of ruleId → last triggered timestamp
  const lastTriggered = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!marketSnapshot) return;

    const now = Date.now();

    for (const rule of rules) {
      if (!rule.enabled) continue;

      // Get the price for the watched token (in cents: multiply by 100)
      const rawPrice =
        rule.token === 'YES' ? marketSnapshot.yesAsk : marketSnapshot.noAsk;
      if (rawPrice == null) continue;

      const priceCents = Math.round(rawPrice * 100);

      const triggered =
        rule.condition === 'ABOVE'
          ? priceCents > rule.threshold
          : priceCents < rule.threshold;

      if (!triggered) {
        // Reset cooldown so it can re-trigger if price crosses again
        delete lastTriggered.current[rule.id];
        continue;
      }

      // Check cooldown
      const lastTime = lastTriggered.current[rule.id];
      if (lastTime && now - lastTime < COOLDOWN_MS) continue;

      // Mark as triggered
      lastTriggered.current[rule.id] = now;

      const conditionLabel = rule.condition === 'ABOVE' ? 'above' : 'below';
      const appMessage = `🔔 ${rule.asset} ${rule.token} hit ${priceCents}¢ — ${conditionLabel} your ${rule.threshold}¢ alert`;
      const tgMessage = `🔔 <b>Price Alert</b>: ${rule.asset} ${rule.token} is now ${priceCents}¢ (${conditionLabel} threshold of ${rule.threshold}¢)`;

      if (rule.notifyApp) {
        toast.warning(appMessage, { duration: 8000 });
      }

      if (rule.notifyTelegram) {
        sendTelegramMessage(telegramBotToken, telegramChatId, tgMessage);
      }
    }
  }, [marketSnapshot, rules, telegramBotToken, telegramChatId]);
}
