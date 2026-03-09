import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCard } from "@/components/shared/StatsCard";
import { getRiderRouteDetail } from "@/services/rider";
import { getCurrentProductSession } from "@/lib/appUser";
import { formatRelativeDate } from "@/lib/format";
import { notFound, redirect } from "next/navigation";
import { Bell, Clock3, FileText, Route } from "lucide-react";

export default async function DashboardRouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "rider") redirect("/dashboard");

  const { id } = await params;
  const route = await getRiderRouteDetail(id);
  if (!route) notFound();

  return (
    <div className="min-h-screen gradient-bg px-4 sm:px-6 py-8 md:py-12 lg:py-16 lg:pt-6">
      <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            Route detail
          </p>
          <h2 className="mt-2 text-3xl font-semibold">{route.name}</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            This route view is read-only for the authenticated rider account and
            mirrors operational status from MOVRR Mobile and dispatch systems.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <Badge
            variant={
              route.status === "completed"
                ? "success"
                : route.status === "in-progress"
                  ? "secondary"
                  : "outline"
            }
            className="capitalize"
          >
            {route.status.replace(/_/g, " ")}
          </Badge>
          <p className="max-w-sm text-sm text-muted-foreground lg:text-right">
            Route execution happens in MOVRR Mobile. This web view shows
            assignment, timeline, and compliance state only.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Route progress"
          value={`${route.routeProgress}%`}
          description="Latest synced progress from mobile execution telemetry"
          icon={Route}
        />
        <StatsCard
          title="Verified minutes"
          value={String(route.verifiedMinutes)}
          description="Tracked time captured from rider execution telemetry"
          icon={Clock3}
        />
        <StatsCard
          title="Distance"
          value={`${route.distanceKm.toFixed(1)} km`}
          description="Accumulated route distance from tracking logs"
          icon={FileText}
        />
        <StatsCard
          title="Last synced"
          value={formatRelativeDate(route.lastSyncedAt)}
          description={`Source ${route.syncSource}`}
          icon={Bell}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="glass-card border-border/60">
          <CardHeader>
            <CardTitle>Route geography</CardTitle>
            <CardDescription>
              Start, end, and zone configuration for the current ride
              assignment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <p className="text-sm text-muted-foreground">Start</p>
                <p className="mt-2 font-medium">
                  {route.startLocation || "Not provided"}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <p className="text-sm text-muted-foreground">End</p>
                <p className="mt-2 font-medium">
                  {route.endLocation || "Not provided"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Compliance posture</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Latest posture derived from synced route progress and
                    telemetry freshness.
                  </p>
                </div>
                <Badge
                  variant={
                    route.complianceStatus === "healthy"
                      ? "success"
                      : route.complianceStatus === "watch"
                        ? "secondary"
                        : "destructive"
                  }
                  className="capitalize"
                >
                  {route.complianceStatus}
                </Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-6">
              <p className="font-medium">Zone map summary</p>
              <p className="mt-2 text-sm text-muted-foreground">
                This workspace shows campaign and hot-zone summaries only.
                Riders should use MOVRR Mobile for active route execution and
                live ride guidance.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Campaign zones</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {(route.campaignZones.length
                      ? route.campaignZones
                      : [{ id: "none", name: "No zones configured" }]
                    ).map((zone: { id: string; name: string | null }) => (
                      <li key={zone.id}>{zone.name || "Unnamed zone"}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium">Hot zones</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {(route.hotZones.length
                      ? route.hotZones
                      : [{ id: "none", name: "No hot zones configured" }]
                    ).map((zone: { id: string; name: string | null }) => (
                      <li key={zone.id}>{zone.name || "Unnamed hot zone"}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-card border-border/60">
            <CardHeader>
              <CardTitle>Route timeline</CardTitle>
              <CardDescription>
                Assignment, execution, and telemetry events synced into the
                rider workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {route.timeline.length ? (
                route.timeline.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-border/60 bg-background/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{event.label}</p>
                      <Badge
                        variant={
                          event.tone === "success"
                            ? "success"
                            : event.tone === "warning"
                              ? "destructive"
                              : event.tone === "info"
                                ? "secondary"
                                : "outline"
                        }
                      >
                        {event.tone}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {event.detail}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatRelativeDate(event.occurredAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No route timeline events are available yet for this
                  assignment.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60">
            <CardHeader>
              <CardTitle>Telemetry summary</CardTitle>
              <CardDescription>
                Recent tracked sessions synced from rider execution flows.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {route.tracking.length ? (
                route.tracking.map(
                  (tracking: {
                    id: string;
                    verified_minutes?: number | null;
                    distance_km?: number | null;
                    started_at?: string | null;
                    ended_at?: string | null;
                  }) => (
                    <div
                      key={tracking.id}
                      className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm"
                    >
                      <p className="font-medium">Tracking session</p>
                      <p className="mt-1 text-muted-foreground">
                        Verified minutes {Number(tracking.verified_minutes ?? 0)}
                      </p>
                      <p className="text-muted-foreground">
                        Distance {Number(tracking.distance_km ?? 0).toFixed(1)} km
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatRelativeDate(
                          tracking.ended_at ?? tracking.started_at ?? null,
                        )}
                      </p>
                    </div>
                  ),
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  No synced route telemetry is available yet for this
                  assignment.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}
