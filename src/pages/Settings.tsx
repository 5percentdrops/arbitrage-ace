import { Settings as SettingsIcon, Users, Clock, Webhook, RotateCcw, MessageCircle } from 'lucide-react';
import { TradingLayout } from '@/components/layout/TradingLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { settings, updateSetting, resetSettings } = useSettings();

  return (
    <TradingLayout>
      <div className="flex-1 p-6 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <SettingsIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">Configure signal parameters and webhooks</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={resetSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Signal Section */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Signal Parameters
            </CardTitle>
            <CardDescription>
              Configure crowd probability and timing thresholds for trade signals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Crowd Probability */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label htmlFor="crowdPct" className="text-sm">
                    Crowd Probability (%)
                  </Label>
                </div>
                <Input
                  id="crowdPct"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="e.g., 67"
                  value={settings.crowdPct}
                  onChange={(e) => updateSetting('crowdPct', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Threshold for crowd sentiment signals
                </p>
              </div>

              {/* Remaining Time */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label htmlFor="remainingTime" className="text-sm">
                    Remaining Time (sec)
                  </Label>
                </div>
                <Input
                  id="remainingTime"
                  type="number"
                  min="0"
                  max="900"
                  step="1"
                  placeholder="e.g., 420"
                  value={settings.remainingTime}
                  onChange={(e) => updateSetting('remainingTime', e.target.value)}
                  className={cn(
                    Number(settings.remainingTime) <= 300 && Number(settings.remainingTime) > 0 && "border-destructive"
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Time threshold for round-based signals
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Section */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Webhook className="h-4 w-4 text-primary" />
              Webhook URLs
            </CardTitle>
            <CardDescription>
              Configure webhook endpoints for external integrations and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Webhook 1 */}
            <div className="space-y-2">
              <Label htmlFor="webhook1" className="text-sm">
                Webhook URL 1
              </Label>
              <Input
                id="webhook1"
                type="url"
                placeholder="https://your-webhook-endpoint.com/1"
                value={settings.webhook1}
                onChange={(e) => updateSetting('webhook1', e.target.value)}
              />
            </div>

            {/* Webhook 2 */}
            <div className="space-y-2">
              <Label htmlFor="webhook2" className="text-sm">
                Webhook URL 2
              </Label>
              <Input
                id="webhook2"
                type="url"
                placeholder="https://your-webhook-endpoint.com/2"
                value={settings.webhook2}
                onChange={(e) => updateSetting('webhook2', e.target.value)}
              />
            </div>

            {/* Webhook 3 */}
            <div className="space-y-2">
              <Label htmlFor="webhook3" className="text-sm">
                Webhook URL 3
              </Label>
              <Input
                id="webhook3"
                type="url"
                placeholder="https://your-webhook-endpoint.com/3"
                value={settings.webhook3}
                onChange={(e) => updateSetting('webhook3', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Telegram Alerts Section */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Telegram Alerts
            </CardTitle>
            <CardDescription>
              Configure incoming alerts from Telegram
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CVD Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="cvdEnabled" className="text-sm">
                  CVD Alerts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enable CVD divergence signals
                </p>
              </div>
              <Switch
                id="cvdEnabled"
                checked={settings.cvdEnabled}
                onCheckedChange={(checked) => updateSetting('cvdEnabled', checked)}
              />
            </div>

            {/* Telegram Chat/Channel ID */}
            <div className="space-y-2">
              <Label htmlFor="telegramChatId" className="text-sm">
                Telegram Chat/Channel ID
              </Label>
              <Input
                id="telegramChatId"
                type="text"
                placeholder="-1001234567890"
                value={settings.telegramChatId}
                onChange={(e) => updateSetting('telegramChatId', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The chat or channel ID to listen for alerts
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TradingLayout>
  );
}
