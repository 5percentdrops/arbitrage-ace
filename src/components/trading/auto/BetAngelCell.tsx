import { cn } from '@/lib/utils';

interface BetAngelCellProps {
  value: number;
  maxDepth: number;
  type: 'back' | 'lay';
  levelPrice: number;
  onClick?: (e: React.MouseEvent) => void;
  hasOrder?: boolean;
  orderLabel?: string;
  orderId?: string;
  orderSide?: 'YES' | 'NO';
  onDragStart?: (orderId: string, side: 'YES' | 'NO', type: 'back' | 'lay') => void;
  onDragEnd?: () => void;
  onDragOver?: (levelPrice: number) => void;
  onDragLeave?: () => void;
  onDrop?: (levelPrice: number) => void;
  isDropTarget?: boolean;
  dropPreviewArbPct?: number;
  isDragDisabled?: boolean;
}

export function BetAngelCell({ 
  value, 
  maxDepth, 
  type, 
  levelPrice,
  onClick, 
  hasOrder,
  orderLabel,
  orderId,
  orderSide,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDropTarget,
  dropPreviewArbPct,
  isDragDisabled,
}: BetAngelCellProps) {
  const depthPercent = maxDepth > 0 ? Math.min((value / maxDepth) * 100, 100) : 0;
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver?.(levelPrice);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop?.(levelPrice);
  };
  
  return (
    <div 
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={() => onDragLeave?.()}
      onDrop={handleDrop}
      className={cn(
        "relative h-7 flex items-center justify-center cursor-pointer",
        "font-mono text-xs font-semibold transition-all",
        "hover:brightness-110 active:brightness-90",
        type === 'back' 
          ? "text-foreground" 
          : "text-foreground",
        hasOrder && "ring-2 ring-inset ring-primary/80",
        isDropTarget && "ring-2 ring-success ring-inset bg-success/20"
      )}
    >
      {/* Arb preview tooltip on drop target */}
      {isDropTarget && dropPreviewArbPct !== undefined && (
        <div className={cn(
          "absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap z-30 pointer-events-none",
          dropPreviewArbPct >= 0 
            ? "bg-success text-success-foreground" 
            : "bg-destructive text-destructive-foreground"
        )}>
          {dropPreviewArbPct >= 0 ? '+' : ''}{dropPreviewArbPct.toFixed(2)}%
        </div>
      )}
      
      {/* Depth bar background - grows from right for back, left for lay */}
      <div 
        className={cn(
          "absolute inset-y-0 transition-all duration-150",
          type === 'back' 
            ? "right-0 bg-[hsl(var(--betangel-back))]" 
            : "left-0 bg-[hsl(var(--betangel-lay))]"
        )}
        style={{ width: `${depthPercent}%` }}
      />
      
      {/* Value text */}
      <span className="relative z-10 drop-shadow-sm">
        {value > 0 ? value.toLocaleString() : '—'}
      </span>
      
      {/* Order indicator badge - draggable */}
      {hasOrder && orderLabel && (
        <span
          draggable={!isDragDisabled && !!orderId}
          onDragStart={(e) => {
            if (isDragDisabled || !orderId || !orderSide) return;
            e.dataTransfer.setData('orderId', orderId);
            e.dataTransfer.setData('side', orderSide);
            e.dataTransfer.setData('type', type);
            e.dataTransfer.effectAllowed = 'move';
            onDragStart?.(orderId, orderSide, type);
          }}
          onDragEnd={() => onDragEnd?.()}
          className={cn(
            "absolute top-0.5 text-[8px] px-1 py-0.5 rounded font-bold z-20",
            "bg-primary text-primary-foreground",
            !isDragDisabled && orderId && "cursor-grab active:cursor-grabbing hover:bg-primary/80",
            type === 'back' ? "right-0.5" : "left-0.5"
          )}
        >
          {orderLabel}
        </span>
      )}
    </div>
  );
}
