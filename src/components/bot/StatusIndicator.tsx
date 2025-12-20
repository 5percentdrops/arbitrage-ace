import { Activity, Wifi, WifiOff } from 'lucide-react';
import { BotStatus, ConnectionStatus } from '@/types/trading';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  botStatus: BotStatus;
  apiStatus: ConnectionStatus;
  rpcStatus: ConnectionStatus;
}

export function StatusIndicator({ botStatus, apiStatus, rpcStatus }: StatusIndicatorProps) {
  const getBotStatusColor = () => {
    switch (botStatus) {
      case 'running':
        return 'bg-success';
      case 'starting':
      case 'stopping':
        return 'bg-warning';
      case 'error':
        return 'bg-destructive';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getConnectionColor = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return 'text-success';
      case 'connecting':
        return 'text-warning';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Bot Status */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          getBotStatusColor(),
          botStatus === 'running' && "animate-pulse glow-success"
        )} />
        <span className="text-sm font-medium capitalize">{botStatus}</span>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1" title="API Connection">
          {apiStatus === 'connected' ? (
            <Wifi className={cn("h-3 w-3", getConnectionColor(apiStatus))} />
          ) : (
            <WifiOff className={cn("h-3 w-3", getConnectionColor(apiStatus))} />
          )}
          <span className={getConnectionColor(apiStatus)}>API</span>
        </div>
        
        <div className="flex items-center gap-1" title="RPC Connection">
          {rpcStatus === 'connected' ? (
            <Activity className={cn("h-3 w-3", getConnectionColor(rpcStatus))} />
          ) : (
            <Activity className={cn("h-3 w-3", getConnectionColor(rpcStatus))} />
          )}
          <span className={getConnectionColor(rpcStatus)}>RPC</span>
        </div>
      </div>
    </div>
  );
}
