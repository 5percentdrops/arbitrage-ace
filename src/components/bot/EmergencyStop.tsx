import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertOctagon } from 'lucide-react';

interface EmergencyStopProps {
  onEmergencyStop: () => void;
}

export function EmergencyStop({ onEmergencyStop }: EmergencyStopProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmergencyStop = () => {
    onEmergencyStop();
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="lg"
          variant="destructive"
          className="h-14 px-4 glow-danger animate-pulse"
        >
          <AlertOctagon className="h-5 w-5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border-destructive/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertOctagon className="h-5 w-5" />
            Emergency Stop
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will immediately stop the bot and cancel all pending orders. 
            Open positions will NOT be closed automatically.
            <br /><br />
            Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEmergencyStop}
            className="bg-destructive hover:bg-destructive/90"
          >
            Emergency Stop
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
