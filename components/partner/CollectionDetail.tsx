import { cancelCollectionAction, confirmCollectionAction } from "@/app/actions/partner";
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
  canCancel=false,
  operationId,
}: {
  item: PartnerPendingFulfilment;
  canConfirm: boolean;
  canCancel?: boolean;
  operationId: string;
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

        {canConfirm && item.version != null ? (
          <form action={confirmCollectionAction} className="pt-2">
            <input type="hidden" name="fulfilmentId" value={item.id} />
            <input type="hidden" name="expectedVersion" value={item.version} />
            <input type="hidden" name="operationId" value={operationId+":collect"} />
            <input type="hidden" name="reason" value="collection_confirmed" />
            <SubmitButton pendingLabel="Confirming…">
              Confirm collection
            </SubmitButton>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your membership role cannot confirm collections.
          </p>
        )}
        {canCancel && item.version != null && !["completed","collected","delivered","dispatched","refunded","reversed"].includes(item.state ?? "") ? <form action={cancelCollectionAction} className="space-y-3">
          <input type="hidden" name="fulfilmentId" value={item.id}/><input type="hidden" name="expectedVersion" value={item.version}/><input type="hidden" name="operationId" value={operationId+":cancel"}/>
          <label className="block text-sm">Cancellation reason (shown to the rider)<input name="reason" required maxLength={1000} className="mt-1 w-full rounded-md border border-input bg-background p-2"/></label>
          <SubmitButton pendingLabel="Cancelling…">Cancel reward</SubmitButton>
        </form> : null}
      </CardContent>
    </Card>
  );
}
