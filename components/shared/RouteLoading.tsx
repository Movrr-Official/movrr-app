import { SectionSkeleton } from "@/components/skeleton/SectionSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function RouteLoading({ withCards = true }: { withCards?: boolean }) {
  return (
    <div className="min-h-screen gradient-bg px-4 sm:px-6 py-8 md:py-12 lg:py-16 lg:pt-6">
      <div className="space-y-6 md:space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-3xl rounded-xl" />
          <Skeleton className="h-4 w-full max-w-2xl rounded-xl" />
        </div>
        {withCards ? <SectionSkeleton /> : null}
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}
