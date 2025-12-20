import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, Server, Wallet, AlertTriangle } from 'lucide-react';
import { ConnectionStatus } from '@/types/trading';
import { formatCurrency } from '@/lib/mockData';

interface RpcConfigPanelProps {
  rpcUrl: string;
  chainId: number;
  rpcStatus: ConnectionStatus;
  blockNumber: number | null;
  rpcError: string | null;
  privateKey: string;
  walletAddress: string | null;
  maticBalance: number;
  usdcBalance: number;
  isTesting: boolean;
  onRpcUrlChange: (url: string) => void;
  onPrivateKeyChange: (key: string) => void;
  onTestConnection: () => void;
  onDisconnect: () => void;
}

export function RpcConfigPanel({
  rpcUrl,
  chainId,
  rpcStatus,
  blockNumber,
  rpcError,
  privateKey,
  walletAddress,
  maticBalance,
  usdcBalance,
  isTesting,
  onRpcUrlChange,
  onPrivateKeyChange,
  onTestConnection,
  onDisconnect,
}: RpcConfigPanelProps) {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [localRpcUrl, setLocalRpcUrl] = useState(rpcUrl);
  const [localPrivateKey, setLocalPrivateKey] = useState(privateKey);

  const handleRpcUrlChange = (value: string) => {
    setLocalRpcUrl(value);
    onRpcUrlChange(value);
  };

  const handlePrivateKeyChange = (value: string) => {
    setLocalPrivateKey(value);
    onPrivateKeyChange(value);
  };

  const getStatusBadge = () => {
    switch (rpcStatus) {
      case 'connected':
        return (
          <Badge className="bg-success/20 text-success border-success/30 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Connected
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Connecting
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
            <XCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Server className="h-3 w-3" />
            Disconnected
          </Badge>
        );
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            Polygon RPC
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* RPC URL */}
        <div className="space-y-2">
          <Label htmlFor="rpc-url" className="text-sm text-muted-foreground">
            RPC URL
          </Label>
          <Input
            id="rpc-url"
            type="text"
            value={localRpcUrl}
            onChange={(e) => handleRpcUrlChange(e.target.value)}
            placeholder="https://polygon-rpc.com"
            className="font-mono text-sm"
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Chain ID: {chainId}</span>
            {blockNumber && rpcStatus === 'connected' && (
              <>
                <span>•</span>
                <span>Block: #{blockNumber.toLocaleString()}</span>
              </>
            )}
          </div>
        </div>

        {/* Error message */}
        {rpcError && (
          <p className="text-sm text-destructive">{rpcError}</p>
        )}

        {/* Private Key Section */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Wallet Configuration</span>
          </div>

          {/* Security Warning */}
          <Alert className="mb-4 border-warning/30 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-xs text-warning">
              Never share your private key. For production use, consider using a dedicated trading wallet with limited funds.
            </AlertDescription>
          </Alert>

          {/* Private Key Input */}
          <div className="space-y-2">
            <Label htmlFor="private-key" className="text-sm text-muted-foreground">
              Private Key
            </Label>
            <div className="relative">
              <Input
                id="private-key"
                type={showPrivateKey ? 'text' : 'password'}
                value={localPrivateKey}
                onChange={(e) => handlePrivateKeyChange(e.target.value)}
                placeholder="Enter your wallet private key"
                className="pr-10 font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
              >
                {showPrivateKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* Derived Wallet Address */}
          {walletAddress && (
            <div className="mt-3 p-3 rounded-md bg-secondary/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Address</span>
                <span className="font-mono text-xs">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">MATIC Balance</span>
                <span className="font-mono text-xs">{maticBalance.toFixed(4)} MATIC</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">USDC Balance</span>
                <span className="font-mono text-xs text-success">{formatCurrency(usdcBalance)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {rpcStatus === 'connected' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              className="flex-1"
            >
              Disconnect
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onTestConnection}
              disabled={isTesting || !localRpcUrl}
              className="flex-1"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
