import { useState, useCallback } from 'react';
import type { PriceAlertRule } from '@/types/price-alerts';

export interface SettingsState {
  // Signal settings
  crowdPct: string;
  remainingTime: string;
  // Telegram Alerts
  telegramChatId: string;
  telegramBotToken: string;
  // Price alert rules
  priceAlertRules: PriceAlertRule[];
}

const STORAGE_KEY = 'trading-settings';

function loadSettings(): SettingsState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        crowdPct: parsed.crowdPct ?? '',
        remainingTime: parsed.remainingTime ?? '',
        telegramChatId: parsed.telegramChatId ?? '',
        telegramBotToken: parsed.telegramBotToken ?? '',
        priceAlertRules: parsed.priceAlertRules ?? [],
      };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return {
    crowdPct: '',
    remainingTime: '',
    telegramChatId: '',
    telegramBotToken: '',
    priceAlertRules: [],
  };
}

function saveSettings(settings: SettingsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<SettingsState>(loadSettings);

  const updateSetting = useCallback(<K extends keyof SettingsState>(
    field: K,
    value: SettingsState[K]
  ) => {
    setSettings(prev => {
      const updated = { ...prev, [field]: value };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const addAlertRule = useCallback((rule: Omit<PriceAlertRule, 'id'>) => {
    const newRule: PriceAlertRule = { ...rule, id: crypto.randomUUID() };
    setSettings(prev => {
      const updated = { ...prev, priceAlertRules: [...prev.priceAlertRules, newRule] };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const deleteAlertRule = useCallback((id: string) => {
    setSettings(prev => {
      const updated = { ...prev, priceAlertRules: prev.priceAlertRules.filter(r => r.id !== id) };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const toggleAlertRule = useCallback((id: string, enabled: boolean) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        priceAlertRules: prev.priceAlertRules.map(r => r.id === id ? { ...r, enabled } : r),
      };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    const defaults: SettingsState = {
      crowdPct: '',
      remainingTime: '',
      telegramChatId: '',
      telegramBotToken: '',
      priceAlertRules: [],
    };
    setSettings(defaults);
    saveSettings(defaults);
  }, []);

  return {
    settings,
    updateSetting,
    addAlertRule,
    deleteAlertRule,
    toggleAlertRule,
    resetSettings,
  };
}
