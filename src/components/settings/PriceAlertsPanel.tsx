import { useState } from 'react';
import { Bell, Trash2, Plus, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { PriceAlertRule } from '@/types/price-alerts';
import type { TokenSymbol } from '@/types/trading';

const ASSETS: TokenSymbol[] = ['BTC', 'ETH', 'SOL', 'XRP'];

interface PriceAlertsPanelProps {
  rules: PriceAlertRule[];
  onAdd: (rule: Omit<PriceAlertRule, 'id'>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

const defaultForm = {
  asset: 'BTC' as TokenSymbol,
  token: 'YES' as 'YES' | 'NO',
  condition: 'ABOVE' as 'ABOVE' | 'BELOW',
  threshold: '',
  notifyApp: true,
  notifyTelegram: true,
};

export function PriceAlertsPanel({ rules, onAdd, onDelete, onToggle }: PriceAlertsPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');

  const handleAdd = () => {
    const val = parseFloat(form.threshold);
    if (isNaN(val) || val <= 0 || val > 100) {
      setError('Threshold must be between 1 and 100 (cents)');
      return;
    }
    onAdd({
      asset: form.asset,
      token: form.token,
      condition: form.condition,
      threshold: Math.round(val),
      notifyApp: form.notifyApp,
      notifyTelegram: form.notifyTelegram,
      enabled: true,
    });
    setForm(defaultForm);
    setError('');
    setShowForm(false);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Price Alerts
            </CardTitle>
            <CardDescription className="mt-1">
              Get notified when a market price crosses your threshold
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowForm(v => !v); setError(''); }}
          >
            {showForm ? <X className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
            {showForm ? 'Cancel' : 'Add Alert'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Add form */}
        {showForm && (
          <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {/* Asset */}
              <div className="space-y-1">
                <Label className="text-xs">Asset</Label>
                <Select value={form.asset} onValueChange={v => setForm(f => ({ ...f, asset: v as TokenSymbol }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSETS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Token */}
              <div className="space-y-1">
                <Label className="text-xs">Token</Label>
                <Select value={form.token} onValueChange={v => setForm(f => ({ ...f, token: v as 'YES' | 'NO' }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YES">YES</SelectItem>
                    <SelectItem value="NO">NO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Condition */}
              <div className="space-y-1">
                <Label className="text-xs">Condition</Label>
                <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v as 'ABOVE' | 'BELOW' }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABOVE">Above (&gt;)</SelectItem>
                    <SelectItem value="BELOW">Below (&lt;)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Threshold */}
              <div className="space-y-1">
                <Label className="text-xs">Threshold (¢)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  placeholder="e.g. 85"
                  value={form.threshold}
                  onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Notification checkboxes */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={form.notifyApp}
                  onCheckedChange={v => setForm(f => ({ ...f, notifyApp: !!v }))}
                />
                In-app notification
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={form.notifyTelegram}
                  onCheckedChange={v => setForm(f => ({ ...f, notifyTelegram: !!v }))}
                />
                Telegram
              </label>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button size="sm" onClick={handleAdd} className="w-full h-8">
              <Check className="h-3.5 w-3.5 mr-1" />
              Save Alert
            </Button>
          </div>
        )}

        {/* Rules list */}
        {rules.length === 0 && !showForm && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No alerts configured. Click "Add Alert" to get started.
          </p>
        )}

        {rules.map(rule => (
          <div
            key={rule.id}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              rule.enabled ? "border-border bg-card" : "border-border/50 bg-muted/20 opacity-60"
            )}
          >
            {/* Enable toggle */}
            <Switch
              checked={rule.enabled}
              onCheckedChange={v => onToggle(rule.id, v)}
              className="shrink-0 scale-75"
            />

            {/* Rule description */}
            <span className="flex-1 font-mono text-xs">
              <Badge variant="outline" className="mr-1 text-xs py-0">{rule.asset}</Badge>
              <span className={rule.token === 'YES' ? 'text-success' : 'text-destructive'}>
                {rule.token}
              </span>
              <span className="text-muted-foreground mx-1">
                {rule.condition === 'ABOVE' ? '>' : '<'}
              </span>
              <span className="font-bold">{rule.threshold}¢</span>
            </span>

            {/* Notify badges */}
            <div className="flex items-center gap-1">
              <Badge
                variant={rule.notifyApp ? 'default' : 'outline'}
                className="text-xs py-0 px-1.5"
              >
                App
              </Badge>
              <Badge
                variant={rule.notifyTelegram ? 'default' : 'outline'}
                className="text-xs py-0 px-1.5"
              >
                TG
              </Badge>
            </div>

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(rule.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
