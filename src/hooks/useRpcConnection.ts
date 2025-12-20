import { useState, useCallback } from 'react';
import { RpcConfig, WalletConfig, ConnectionStatus } from '@/types/trading';
import { deriveWalletAddress } from '@/lib/mockData';

export function useRpcConnection() {
  const [rpcConfig, setRpcConfig] = useState<RpcConfig>({
    rpcUrl: '',
    chainId: 137,
    status: 'disconnected',
    blockNumber: null,
    error: null,
  });

  const [walletConfig, setWalletConfig] = useState<WalletConfig>({
    privateKey: '',
    address: null,
    maticBalance: 0,
    usdcBalance: 0,
  });

  const [isTesting, setIsTesting] = useState(false);

  const updateRpcUrl = useCallback((rpcUrl: string) => {
    setRpcConfig(prev => ({
      ...prev,
      rpcUrl,
      status: 'disconnected',
      blockNumber: null,
      error: null,
    }));
  }, []);

  const updatePrivateKey = useCallback((privateKey: string) => {
    const address = deriveWalletAddress(privateKey);
    setWalletConfig(prev => ({
      ...prev,
      privateKey,
      address,
      // Simulate some balance for demo if address is derived
      maticBalance: address ? Math.random() * 10 : 0,
      usdcBalance: address ? Math.random() * 1000 + 100 : 0,
    }));
  }, []);

  const testRpcConnection = useCallback(async (): Promise<boolean> => {
    if (!rpcConfig.rpcUrl) {
      setRpcConfig(prev => ({
        ...prev,
        status: 'error',
        error: 'RPC URL is required',
      }));
      return false;
    }

    setIsTesting(true);
    setRpcConfig(prev => ({ ...prev, status: 'connecting', error: null }));

    // Simulate RPC connection test
    return new Promise((resolve) => {
      setTimeout(() => {
        // Validate URL format
        try {
          new URL(rpcConfig.rpcUrl);
        } catch {
          setRpcConfig(prev => ({
            ...prev,
            status: 'error',
            error: 'Invalid RPC URL format',
          }));
          setIsTesting(false);
          resolve(false);
          return;
        }

        // Simulate 85% success rate for demo
        const success = Math.random() > 0.15;
        
        if (success) {
          const blockNumber = Math.floor(Math.random() * 1000000) + 50000000;
          setRpcConfig(prev => ({
            ...prev,
            status: 'connected',
            blockNumber,
            error: null,
          }));
          setIsTesting(false);
          resolve(true);
        } else {
          setRpcConfig(prev => ({
            ...prev,
            status: 'error',
            error: 'Failed to connect to RPC endpoint',
          }));
          setIsTesting(false);
          resolve(false);
        }
      }, 1500);
    });
  }, [rpcConfig.rpcUrl]);

  const disconnectRpc = useCallback(() => {
    setRpcConfig(prev => ({
      ...prev,
      status: 'disconnected',
      blockNumber: null,
      error: null,
    }));
  }, []);

  const setRpcStatus = useCallback((status: ConnectionStatus) => {
    setRpcConfig(prev => ({ ...prev, status }));
  }, []);

  return {
    rpcConfig,
    walletConfig,
    isTesting,
    updateRpcUrl,
    updatePrivateKey,
    testRpcConnection,
    disconnectRpc,
    setRpcStatus,
    setRpcConfig,
    setWalletConfig,
  };
}
