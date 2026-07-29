import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import type { PartnerPendingFulfilment } from "@/schemas";

export function CollectionsTable({
  items,
}: {
  items: PartnerPendingFulfilment[];
}) {
  if (!items.length) {
    return (
      <EmptyState
        title="No pending collections"
        description="Pending fulfilments from Platform will list here for confirmation."
        iconName="dashboard"
      />
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Pending collections</CardTitle>
        <CardDescription>
          Read model from Platform GET /api/v1/partners/fulfilments/pending.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/collections/${item.id}`}
            className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/70 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-semibold">{item.id}</p>
              <p className="text-xs text-muted-foreground">
                {item.fulfilmentType ?? "fulfilment"}
                {item.catalogItemId ? ` · ${item.catalogItemId}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.state ? (
                <Badge variant="outline" className="capitalize">
                  {item.state}
                </Badge>
              ) : null}
              {item.progress ? (
                <Badge variant="secondary" className="capitalize">
                  {item.progress}
                </Badge>
              ) : null}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
