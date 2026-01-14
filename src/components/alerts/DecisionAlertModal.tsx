import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { DecisionAlertCard } from './DecisionAlertCard';
import type { DecisionAlert, AlertAction } from '@/types/decision-alerts';

interface DecisionAlertModalProps {
  alerts: DecisionAlert[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (id: string, action: AlertAction) => Promise<boolean>;
  isActionInFlight: boolean;
}

export function DecisionAlertModal({
  alerts,
  isOpen,
  onOpenChange,
  onAction,
  isActionInFlight
}: DecisionAlertModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const previousAlertsLength = useRef(alerts.length);

  // Reset index when alerts change significantly
  useEffect(() => {
    if (alerts.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= alerts.length) {
      setCurrentIndex(Math.max(0, alerts.length - 1));
    }
    previousAlertsLength.current = alerts.length;
  }, [alerts.length, currentIndex]);

  // Auto-open when first alert arrives
  useEffect(() => {
    if (alerts.length > 0 && previousAlertsLength.current === 0) {
      onOpenChange(true);
    }
  }, [alerts.length, onOpenChange]);

  const currentAlert = alerts[currentIndex];
  const hasMultiple = alerts.length > 1;

  const handleAction = async (id: string, action: AlertAction) => {
    const success = await onAction(id, action);
    if (success && alerts.length === 1) {
      // Last alert was actioned, close modal
      onOpenChange(false);
    }
    return success;
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : alerts.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < alerts.length - 1 ? prev + 1 : 0));
  };

  if (!currentAlert) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              🔔 Trading Opportunity
              {hasMultiple && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({currentIndex + 1} of {alerts.length})
                </span>
              )}
            </DialogTitle>
            
            {hasMultiple && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevious}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNext}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="p-4 pt-2">
          <DecisionAlertCard
            alert={currentAlert}
            onAction={handleAction}
            isActionInFlight={isActionInFlight}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
