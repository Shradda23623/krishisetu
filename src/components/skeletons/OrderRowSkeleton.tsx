import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function OrderRowSkeleton() {
  return (
    <Card className="glass-card border-0 rounded-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
            <Skeleton className="h-3 w-full max-w-xs" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <OrderRowSkeleton key={i} />
      ))}
    </div>
  );
}
