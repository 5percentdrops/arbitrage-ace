import { useState, useCallback } from 'react';

export interface SettingsState {
  // Signal settings
  crowdPct: string;
  remainingTime: string;
  // Telegram Alerts
  telegramChatId: string;
}

const STORAGE_KEY = 'trading-settings';

function loadSettings(): SettingsState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return {
    crowdPct: '',
    remainingTime: '',
    telegramChatId: '',
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

  const resetSettings = useCallback(() => {
    const defaults: SettingsState = {
      crowdPct: '',
      remainingTime: '',
      telegramChatId: '',
    };
    setSettings(defaults);
    saveSettings(defaults);
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
  };
}
