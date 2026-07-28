import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdvertiserCampaign } from "@/schemas";
import { formatCurrency, formatDateTime } from "@/lib/format";

export function AdvertiserCampaignList({ campaigns }: { campaigns: AdvertiserCampaign[] }) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Campaign portfolio</CardTitle>
        <CardDescription>
          Read-only visibility into active, draft, and completed campaigns published to your advertiser account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {campaigns.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/dashboard/campaigns/${campaign.id}`}
            className="block rounded-xl border border-border/60 bg-background/70 p-4 transition-colors hover:border-primary/40"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold">{campaign.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {campaign.description || "No campaign description provided."}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Budget {formatCurrency(campaign.budget)}</span>
                  <span>Start {formatDateTime(campaign.startDate)}</span>
                  <span>End {formatDateTime(campaign.endDate)}</span>
                  <span>Riders {campaign.ridersAssigned}</span>
                  <span>QR scans {campaign.qrScans}</span>
                </div>
              </div>
              <Badge variant={campaign.lifecycleStatus === "active" ? "success" : "secondary"} className="capitalize">
                {campaign.lifecycleStatus.replace(/_/g, " ")}
              </Badge>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
