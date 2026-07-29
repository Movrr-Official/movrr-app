import { confirmCollectionAction } from "@/app/actions/partner";
import { SubmitButton } from "@/components/form/SubmitButton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PartnerPendingFulfilment } from "@/schemas";

export function CollectionDetail({
  item,
  canConfirm,
}: {
  item: PartnerPendingFulfilment;
  canConfirm: boolean;
}) {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Collection detail</CardTitle>
            <CardDescription>
              Confirmation posts to Platform with an Idempotency-Key. No local
              fulfilment rules.
            </CardDescription>
          </div>
          {item.state ? (
            <Badge variant="outline" className="capitalize">
              {item.state}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Fulfilment id</dt>
            <dd className="font-medium break-all">{item.id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium">{item.fulfilmentType ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Progress</dt>
            <dd className="font-medium capitalize">{item.progress ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Expires</dt>
            <dd className="font-medium">{item.expiresAt ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Catalog item</dt>
            <dd className="font-medium break-all">
              {item.catalogItemId ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Rider</dt>
            <dd className="font-medium break-all">{item.riderId ?? "—"}</dd>
          </div>
        </dl>

        {canConfirm ? (
          <form action={confirmCollectionAction} className="pt-2">
            <input type="hidden" name="fulfilmentId" value={item.id} />
            <SubmitButton pendingLabel="Confirming…">
              Confirm collection
            </SubmitButton>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your membership role cannot confirm collections.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
