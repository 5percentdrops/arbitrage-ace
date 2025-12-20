import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TokenSymbol, TOKENS, TOKEN_INFO } from '@/types/trading';
import { cn } from '@/lib/utils';

interface TokenSelectorProps {
  selectedTokens: TokenSymbol[];
  onToggle: (token: TokenSymbol) => void;
}

export function TokenSelector({ selectedTokens, onToggle }: TokenSelectorProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Token Selection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {TOKENS.map((token) => {
            const isSelected = selectedTokens.includes(token);
            const info = TOKEN_INFO[token];
            return (
              <Button
                key={token}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onToggle(token)}
                className={cn(
                  "font-mono font-semibold transition-all",
                  isSelected && "ring-2 ring-primary/50"
                )}
              >
                {token}
              </Button>
            );
          })}
        </div>
        {selectedTokens.length === 0 && (
          <p className="text-xs text-destructive mt-2">Select at least one token</p>
        )}
      </CardContent>
    </Card>
  );
}
