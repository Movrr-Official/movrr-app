"use client";
import Link from "next/link";
import { cancelCollectionAction, confirmCollectionAction } from "@/app/actions/partner";
import { SubmitButton } from "@/components/form/SubmitButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnline } from "@/lib/useOnline";
import { partnerLabel } from "@/lib/partnerPresentation";
import type { PartnerPendingFulfilment } from "@/schemas";
export function CollectionDetail({ item, canConfirm, canCancel = false, operationId, initialLocale = "en" }: {
  item: PartnerPendingFulfilment; canConfirm: boolean; canCancel?: boolean; operationId: string; initialLocale?: "en" | "nl";
}) {
  const online = useOnline();
  const nl = initialLocale === "nl";
  const validated = item.state === "validated";
  const terminal = ["completed", "collected", "delivered", "dispatched", "cancelled", "expired", "refunded", "reversed"].includes(item.state ?? "");
  const expiry = item.expiresAt ? new Date(item.expiresAt) : null;
  return <Card className="mx-auto max-w-2xl border-border" lang={nl ? "nl" : "en"}>
    <CardHeader><div className="flex items-start justify-between gap-4"><div className="space-y-2">
      <CardTitle>{item.rewardTitle ?? (nl ? "Beloning ophalen" : "Reward collection")}</CardTitle>
      <CardDescription>{terminal ? (nl ? "Bekijk het vastgelegde resultaat van deze beloning." : "View the recorded outcome for this reward.") : nl ? "Controleer de beloning en bevestig de overdracht aan de fietser." : "Review the reward and confirm the handover to the rider."}</CardDescription>
    </div></div></CardHeader>
    <CardContent className="space-y-5">
      <Badge variant="outline">{partnerLabel(item.state, nl ? "nl" : "en")}</Badge>
      <p className="text-sm text-muted-foreground">{partnerLabel(item.fulfilmentType, nl ? "nl" : "en")}</p>
      {expiry && !Number.isNaN(expiry.getTime()) && <p className="text-sm">{nl ? "Geldig tot: " : "Expires: "}{new Intl.DateTimeFormat(nl ? "nl-NL" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Amsterdam" }).format(expiry)}</p>}
      {!online && <p role="alert">{nl ? "Je bent offline. Maak verbinding voordat je de beloning overhandigt." : "You're offline. Reconnect before handing over the reward."}</p>}
      {canConfirm && item.version != null && validated ? <form action={confirmCollectionAction} className="space-y-4">
        <input type="hidden" name="fulfilmentId" value={item.id} /><input type="hidden" name="expectedVersion" value={item.version} />
        <input type="hidden" name="operationId" value={operationId + ":collect"} /><input type="hidden" name="reason" value="collection_confirmed" />
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" required className="mt-1 size-5" />{nl ? "Ik heb deze beloning aan de fietser overhandigd." : "I have handed this reward to the rider."}</label>
        <SubmitButton disabled={!online} pendingLabel={nl ? "Bevestigen..." : "Confirming..."} className="min-h-12 w-full">{nl ? "Ophalen bevestigen" : "Confirm collection"}</SubmitButton>
      </form> : terminal ? <p className="rounded-xl border border-border bg-muted p-4 text-sm">{nl ? "Deze beloning is afgesloten. Er is geen verdere overdracht nodig." : "This reward is closed. No further handover is needed."}</p> : <p className="text-sm text-muted-foreground">{!canConfirm ? (nl ? "Je rol kan ophalen niet bevestigen." : "Your role cannot confirm collections.") : (nl ? "Scan eerst de QR-code van de fietser." : "Scan the rider's QR code before confirming collection.")}</p>}
      {!validated && !terminal && canConfirm && <Link href="/dashboard/validate" className="inline-block rounded-lg border border-input px-4 py-3 text-sm">{nl ? "QR-code scannen" : "Scan QR code"}</Link>}
      {canCancel && item.version != null && !terminal && <form action={cancelCollectionAction} className="space-y-3 border-t border-border pt-5" onSubmit={event => { if (!window.confirm(nl ? "Deze beloning annuleren? De fietser ontvangt je reden." : "Cancel this reward? The rider will receive your reason.")) event.preventDefault(); }}>
        <input type="hidden" name="fulfilmentId" value={item.id} /><input type="hidden" name="expectedVersion" value={item.version} /><input type="hidden" name="operationId" value={operationId + ":cancel"} />
        <label className="block text-sm">{nl ? "Reden voor de fietser" : "Cancellation reason for the rider"}<input name="reason" required maxLength={1000} className="mt-2 w-full rounded-md border border-input bg-background p-3" /></label>
        <SubmitButton disabled={!online} variant="outline" pendingLabel={nl ? "Annuleren..." : "Cancelling..."}>{nl ? "Beloning annuleren" : "Cancel reward"}</SubmitButton>
      </form>}
    </CardContent>
  </Card>;
}
