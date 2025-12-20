import { useState, useCallback } from 'react';
import { ApiConfig, ConnectionStatus } from '@/types/trading';

export function useApiConnection() {
  const [config, setConfig] = useState<ApiConfig>({
    apiKey: '',
    apiSecret: '',
    status: 'disconnected',
    lastConnected: null,
    error: null,
  });

  const [isTesting, setIsTesting] = useState(false);

  const updateCredentials = useCallback((apiKey: string, apiSecret: string) => {
    setConfig(prev => ({
      ...prev,
      apiKey,
      apiSecret,
      status: 'disconnected',
      error: null,
    }));
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!config.apiKey || !config.apiSecret) {
      setConfig(prev => ({
        ...prev,
        status: 'error',
        error: 'API key and secret are required',
      }));
      return false;
    }

    setIsTesting(true);
    setConfig(prev => ({ ...prev, status: 'connecting', error: null }));

    // Simulate API connection test
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 90% success rate for demo
        const success = Math.random() > 0.1;
        
        if (success) {
          setConfig(prev => ({
            ...prev,
            status: 'connected',
            lastConnected: new Date(),
            error: null,
          }));
          setIsTesting(false);
          resolve(true);
        } else {
          setConfig(prev => ({
            ...prev,
            status: 'error',
            error: 'Failed to authenticate with Polymarket API',
          }));
          setIsTesting(false);
          resolve(false);
        }
      }, 2000);
    });
  }, [config.apiKey, config.apiSecret]);

  const disconnect = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      status: 'disconnected',
      lastConnected: null,
      error: null,
    }));
  }, []);

  const setStatus = useCallback((status: ConnectionStatus) => {
    setConfig(prev => ({ ...prev, status }));
  }, []);

  return {
    config,
    isTesting,
    updateCredentials,
    testConnection,
    disconnect,
    setStatus,
    setConfig,
  };
}
