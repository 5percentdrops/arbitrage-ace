import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DecisionAlertsSkeleton() {
  return (
    <div className="relative px-12">
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-center mt-4 text-sm text-muted-foreground">
        Loading alerts...
      </div>
    </div>
  );
}
