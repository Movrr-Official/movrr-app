import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import { partnerLabel } from "@/lib/partnerPresentation";
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

export async function CollectionsTable({
  items, history = false,
}: {
  items: PartnerPendingFulfilment[]; history?: boolean;
}) {
  const locale = await getPartnerLocale();
  const t = (text: string) => partnerText(locale, text);
  if (!items.length) {
    return (
      <EmptyState
        title={t(history ? "No collection history available" : "No pending collections")}
        description={t(history ? "Completed and cancelled rewards will appear here." : "Rewards ready for collection will appear here.")}
        iconName="dashboard"
      />
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>{t(history ? "Collection history" : "Pending collections")}</CardTitle>
        <CardDescription>{t("Scan the rider QR code, then open the reward to confirm handover.")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/collections/${item.id}`}
            className="partner-collection-row flex flex-col gap-2 rounded-xl border border-border/60 bg-background/70 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-semibold">{item.rewardTitle ?? t("Reward collection")}</p>
              <p className="text-xs text-muted-foreground">
                {partnerLabel(item.fulfilmentType, locale)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.state ? (
                <Badge variant="outline" className="capitalize">
                  {partnerLabel(item.state, locale)}
                </Badge>
              ) : null}

            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
