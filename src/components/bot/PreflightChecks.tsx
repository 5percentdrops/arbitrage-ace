import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { PreflightCheck } from '@/types/trading';
import { cn } from '@/lib/utils';

interface PreflightChecksProps {
  checks: PreflightCheck[];
}

export function PreflightChecks({ checks }: PreflightChecksProps) {
  const allPassed = checks.every(check => check.passed);
  const failedCount = checks.filter(check => !check.passed).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Preflight Checks</span>
        {allPassed ? (
          <span className="text-xs text-success flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            All passed
          </span>
        ) : (
          <span className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {failedCount} failed
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {checks.map((check) => (
          <div
            key={check.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-md text-xs",
              check.passed 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}
          >
            {check.passed ? (
              <CheckCircle2 className="h-3 w-3 shrink-0" />
            ) : (
              <XCircle className="h-3 w-3 shrink-0" />
            )}
            <span className="truncate">{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
