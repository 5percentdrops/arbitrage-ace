import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, Wifi } from 'lucide-react';
import { ConnectionStatus } from '@/types/trading';
import { cn } from '@/lib/utils';

interface ApiConfigPanelProps {
  apiKey: string;
  apiSecret: string;
  status: ConnectionStatus;
  lastConnected: Date | null;
  error: string | null;
  isTesting: boolean;
  onCredentialsChange: (apiKey: string, apiSecret: string) => void;
  onTestConnection: () => void;
  onDisconnect: () => void;
}

export function ApiConfigPanel({
  apiKey,
  apiSecret,
  status,
  lastConnected,
  error,
  isTesting,
  onCredentialsChange,
  onTestConnection,
  onDisconnect,
}: ApiConfigPanelProps) {
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [localKey, setLocalKey] = useState(apiKey);
  const [localSecret, setLocalSecret] = useState(apiSecret);

  const handleKeyChange = (value: string) => {
    setLocalKey(value);
    onCredentialsChange(value, localSecret);
  };

  const handleSecretChange = (value: string) => {
    setLocalSecret(value);
    onCredentialsChange(localKey, value);
  };

  const getStatusBadge = () => {
    switch (status) {
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
            <Wifi className="h-3 w-3" />
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
            <Wifi className="h-4 w-4 text-primary" />
            Polymarket API
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-sm text-muted-foreground">
            API Key
          </Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              value={localKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder="Enter your Polymarket API key"
              className="pr-10 font-mono text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* API Secret */}
        <div className="space-y-2">
          <Label htmlFor="api-secret" className="text-sm text-muted-foreground">
            API Secret
          </Label>
          <div className="relative">
            <Input
              id="api-secret"
              type={showSecret ? 'text' : 'password'}
              value={localSecret}
              onChange={(e) => handleSecretChange(e.target.value)}
              placeholder="Enter your Polymarket API secret"
              className="pr-10 font-mono text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Last connected */}
        {lastConnected && status === 'connected' && (
          <p className="text-xs text-muted-foreground">
            Last connected: {lastConnected.toLocaleTimeString()}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {status === 'connected' ? (
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
              disabled={isTesting || !localKey || !localSecret}
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
