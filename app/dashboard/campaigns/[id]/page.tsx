import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/StatCard";
import { getAdvertiserCampaignDetail } from "@/services/advertiser";
import { getCurrentProductSession } from "@/lib/appUser";
import { formatCurrency, formatRelativeDate } from "@/lib/format";
import { notFound, redirect } from "next/navigation";

export default async function DashboardCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "advertiser") redirect("/dashboard/campaigns");

  const { id } = await params;
  const campaign = await getAdvertiserCampaignDetail(id);
  if (!campaign) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Campaign detail</p>
          <h2 className="mt-2 text-3xl font-semibold">{campaign.name}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{campaign.description || "No campaign description provided."}</p>
        </div>
        <Badge variant={campaign.lifecycleStatus === "active" ? "success" : "secondary"} className="capitalize">
          {campaign.lifecycleStatus.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Budget" value={formatCurrency(campaign.budget)} detail="Configured campaign budget" iconName="budget" />
        <StatCard title="Impressions" value={String(campaign.impressions)} detail="Recorded impression volume" iconName="impressions" />
        <StatCard title="QR scans" value={String(campaign.qrScans)} detail="Attributed QR scan volume" iconName="dashboard" />
        <StatCard title="Riders" value={String(campaign.riders.length)} detail="Visible participant count" iconName="users" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card className="glass-card border-border/60">
            <CardHeader>
              <CardTitle>Campaign metadata</CardTitle>
              <CardDescription>Read-only campaign configuration and pacing posture published by MOVRR operations.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background/70 p-4"><p className="text-sm text-muted-foreground">Type</p><p className="mt-2 font-medium capitalize">{campaign.campaignType.replace(/_/g, " ")}</p></div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-4"><p className="text-sm text-muted-foreground">Target zones</p><p className="mt-2 font-medium">{campaign.targetZones.length || campaign.metadata.zoneCount}</p></div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-4"><p className="text-sm text-muted-foreground">Date window</p><p className="mt-2 font-medium">{formatRelativeDate(campaign.startDate)} to {formatRelativeDate(campaign.endDate)}</p></div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-4"><p className="text-sm text-muted-foreground">Pacing health</p><p className="mt-2 font-medium capitalize">{campaign.metadata.pacingHealth}</p></div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60">
            <CardHeader>
              <CardTitle>Zones and hot zones</CardTitle>
              <CardDescription>Campaign delivery geography adapted from the admin zone model.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <p className="font-medium">Campaign zones</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {(campaign.zones.length ? campaign.zones : [{ id: "none", name: "No zones configured" }]).map((zone: { id: string; name: string | null }) => (
                    <li key={zone.id}>{zone.name || "Unnamed zone"}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <p className="font-medium">Hot zones</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {(campaign.hotZones.length ? campaign.hotZones : [{ id: "none", name: "No hot zones configured" }]).map((zone: { id: string; name: string | null; bonus_percent?: number | null }) => (
                    <li key={zone.id}>{zone.name || "Unnamed hot zone"}{zone.bonus_percent ? ` · +${zone.bonus_percent}%` : ""}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card border-border/60">
            <CardHeader>
              <CardTitle>Campaign timeline</CardTitle>
              <CardDescription>Status progression and freshness cues for this campaign.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaign.timeline.length ? (
                campaign.timeline.map((event: { id: string; label: string; detail: string; occurredAt: string | null; tone: "default" | "info" | "success" | "warning" }) => (
                  <div key={event.id} className="rounded-xl border border-border/60 bg-background/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{event.label}</p>
                      <Badge variant={event.tone === "success" ? "success" : event.tone === "warning" ? "destructive" : event.tone === "info" ? "secondary" : "outline"}>{event.tone}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{event.detail}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatRelativeDate(event.occurredAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No campaign timeline events are visible yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60">
            <CardHeader>
              <CardTitle>Rider participation visibility</CardTitle>
              <CardDescription>Participant identities visible to the authenticated advertiser account only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaign.riders.length ? (
                campaign.riders.map((rider: { id: string; name: string; email: string; city?: string | null; country?: string | null }) => (
                  <div key={rider.id} className="rounded-xl border border-border/60 bg-background/70 p-4">
                    <p className="font-medium">{rider.name}</p>
                    <p className="text-sm text-muted-foreground">{rider.email}</p>
                    <p className="text-xs text-muted-foreground">{[rider.city, rider.country].filter(Boolean).join(", ") || "Location unavailable"}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No rider participation is visible for this campaign yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
