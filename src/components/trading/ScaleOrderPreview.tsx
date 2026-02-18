import { useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const PRICE_OFFSETS_CENTS = [0, 3, 6, 9, 12, 15, 18];
const STAKE_PRESETS = [10, 25, 50, 100, 250, 500, 1000];
const TIER_WEIGHTS = [0.25, 0.18, 0.15, 0.13, 0.11, 0.10, 0.08]; // heavy → light

interface ScaleOrderPreviewProps {
  mode: 'scale-in' | 'scale-out';
  /** Base price in decimal form (e.g. 0.52 = 52¢) */
  basePrice: number;
  totalStake: number;
  onStakeChange: (v: number) => void;
}


export function ScaleOrderPreview({ mode, basePrice, totalStake, onStakeChange }: ScaleOrderPreviewProps) {
  const [customStake, setCustomStake] = useState('');

  const baseCents = Math.round(basePrice * 100);

  const tiers = PRICE_OFFSETS_CENTS.map((offsetCents, i) => {
    let priceCents: number;
    let weight: number;

    if (mode === 'scale-in') {
      // Buy dips: prices go DOWN from base.
      // Lightest at top (L1 = base price), heaviest at bottom (L7 = cheapest).
      priceCents = baseCents - offsetCents;
      weight = TIER_WEIGHTS[6 - i]; // reversed: L1=8%, L7=25%
    } else {
      // Sell rallies: display highest sell price at TOP.
      // L1 = base+18¢ (heaviest, best sell), L7 = base (lightest).
      priceCents = baseCents + (18 - offsetCents);
      weight = TIER_WEIGHTS[i]; // normal: L1=25%, L7=8%
    }

    const usd = totalStake * weight;
    return {
      tier: `L${i + 1}`,
      priceCents: Math.max(1, Math.min(99, priceCents)),
      weight,
      usd,
      isTop: i === 0,
      isBottom: i === 6,
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
              // Scale In: heaviest at bottom (L7=25%), lightest at top (L1=8%)
              // Scale Out: heaviest at top (L1=25%), lightest at bottom (L7=8%)
              const isHeaviest = isScaleIn ? i === 6 : i === 0;
              const isLightest = isScaleIn ? i === 0 : i === 6;
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
                    {tier.priceCents}¢
                  </TableCell>
                  <TableCell className="px-3 py-1.5 text-muted-foreground">
                    {Math.round(tier.weight * 100)}%
                  </TableCell>
                  <TableCell className="px-3 py-1.5 text-right font-mono font-semibold">
                    ${tier.usd.toFixed(2)}
                    {isHeaviest && isScaleIn && (
                      <span className="ml-1 text-success text-[10px]">▼ heaviest</span>
                    )}
                    {isLightest && isScaleIn && (
                      <span className="ml-1 text-muted-foreground text-[10px]">▲ lightest</span>
                    )}
                    {isHeaviest && !isScaleIn && (
                      <span className="ml-1 text-destructive text-[10px]">▲ heaviest</span>
                    )}
                    {isLightest && !isScaleIn && (
                      <span className="ml-1 text-muted-foreground text-[10px]">▼ lightest</span>
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
        {' · '}Base price: <span className="font-mono">{baseCents}¢</span>
        {' · '}Steps: 3¢ per tier
      </p>
    </div>
  );
}
