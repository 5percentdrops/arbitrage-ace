import { useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const PRICE_OFFSETS_CENTS = [0, 3, 6, 9, 12, 15, 18];
const STAKE_PRESETS = [10, 25, 50, 100, 250, 500, 1000];
const TIER_WEIGHTS = [0.08, 0.10, 0.11, 0.13, 0.15, 0.18, 0.25]; // light → heavy (L1→L7)

interface ScaleOrderPreviewProps {
  mode: 'scale-in' | 'scale-out';
  totalStake: number;
  onStakeChange: (v: number) => void;
}

export function ScaleOrderPreview({ mode, totalStake, onStakeChange }: ScaleOrderPreviewProps) {
  const [customStake, setCustomStake] = useState('');
  const [l1Price, setL1Price] = useState('');

  const l1PriceCents = parseFloat(l1Price);
  const hasL1Price = !isNaN(l1PriceCents) && l1PriceCents > 0;

  const tiers = PRICE_OFFSETS_CENTS.map((offsetCents, i) => {
    if (!hasL1Price) {
      return { tier: `L${i + 1}`, priceCents: null, weight: TIER_WEIGHTS[i], usd: totalStake * TIER_WEIGHTS[i] };
    }

    // Both modes: L1 is lightest (8%), L7 is heaviest (25%)
    // Scale In: price decreases from L1 downward
    // Scale Out: price increases from L1 upward
    const priceCents = mode === 'scale-in'
      ? l1PriceCents - offsetCents
      : l1PriceCents + offsetCents;

    const weight = TIER_WEIGHTS[i]; // L1=8%, L7=25%
    const usd = totalStake * weight;

    return {
      tier: `L${i + 1}`,
      priceCents: Math.max(1, Math.min(99, priceCents)),
      weight,
      usd,
    };
  });

  const handleCustomStake = (val: string) => {
    setCustomStake(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      onStakeChange(parsed);
    }
  };

  const isScaleIn = mode === 'scale-in';

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
      {/* Header */}
      <div className="flex items-center gap-2">
        {isScaleIn ? (
          <TrendingDown className="h-4 w-4 text-success" />
        ) : (
          <TrendingUp className="h-4 w-4 text-destructive" />
        )}
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
          {isScaleIn ? 'Scale In Preview — Buy Dips' : 'Scale Out Preview — Sell Rallies'}
        </span>
      </div>

      {/* L1 Price Input */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">L1 Price (¢)</Label>
        <Input
          type="number"
          min="1"
          max="99"
          step="1"
          placeholder="e.g. 52"
          value={l1Price}
          onChange={(e) => setL1Price(e.target.value)}
          className="h-8 text-sm font-mono"
        />
        {!hasL1Price && (
          <p className="text-[10px] text-muted-foreground">Enter L1 price to see tier breakdown</p>
        )}
      </div>

      {/* Stake Presets */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Total Stake</p>
        <div className="flex flex-wrap gap-1.5">
          {STAKE_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              size="sm"
              variant={totalStake === preset && !customStake ? 'default' : 'outline'}
              className="h-7 px-2 text-xs"
              onClick={() => {
                setCustomStake('');
                onStakeChange(preset);
              }}
            >
              ${preset >= 1000 ? `${preset / 1000}K` : preset}
            </Button>
          ))}
          <Input
            type="number"
            min="1"
            step="1"
            placeholder="Custom"
            value={customStake}
            onChange={(e) => handleCustomStake(e.target.value)}
            className="h-7 w-20 text-xs px-2"
          />
        </div>
      </div>

      {/* Tier Table */}
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="h-8 px-3 text-xs w-12">Tier</TableHead>
              <TableHead className="h-8 px-3 text-xs">Price</TableHead>
              <TableHead className="h-8 px-3 text-xs">Weight</TableHead>
              <TableHead className="h-8 px-3 text-xs text-right">USD</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((tier, i) => {
              const isLightest = i === 0; // L1 always lightest
              const isHeaviest = i === 6; // L7 always heaviest
              return (
                <TableRow
                  key={tier.tier}
                  className={cn(
                    "text-xs",
                    isHeaviest && isScaleIn && "bg-success/5",
                    isHeaviest && !isScaleIn && "bg-destructive/5",
                    isLightest && "bg-muted/10",
                  )}
                >
                  <TableCell className="px-3 py-1.5 font-mono font-medium text-muted-foreground">
                    {tier.tier}
                  </TableCell>
                  <TableCell className="px-3 py-1.5 font-mono font-bold">
                    {tier.priceCents !== null ? `${tier.priceCents}¢` : '—'}
                  </TableCell>
                  <TableCell className="px-3 py-1.5 text-muted-foreground">
                    {Math.round(tier.weight * 100)}%
                  </TableCell>
                  <TableCell className="px-3 py-1.5 text-right font-mono font-semibold">
                    ${tier.usd.toFixed(2)}
                    {isLightest && (
                      <span className="ml-1 text-muted-foreground text-[10px]">▲ lightest</span>
                    )}
                    {isHeaviest && isScaleIn && (
                      <span className="ml-1 text-success text-[10px]">▼ heaviest</span>
                    )}
                    {isHeaviest && !isScaleIn && (
                      <span className="ml-1 text-destructive text-[10px]">▼ heaviest</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Total: <span className="font-mono font-semibold">${totalStake.toFixed(2)}</span>
        {' · '}Steps: 3¢ per tier
      </p>
    </div>
  );
}
