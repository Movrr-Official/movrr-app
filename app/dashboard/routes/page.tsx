import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProductSession } from "@/lib/appUser";
import { formatRelativeDate } from "@/lib/format";
import { getRiderDashboardData } from "@/services/rider";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardRoutesPage() {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "rider") redirect("/dashboard");

  const dashboard = await getRiderDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Routes"
        description="Read-only route visibility for your rider account. Live execution, ride start, and ride completion remain in MOVRR Mobile."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Assigned routes" value={dashboard.routes.length} detail="Route assignments visible in your web workspace" iconName="routes" />
        <StatCard title="Active routes" value={dashboard.activeRoutes} detail="Assignments currently in progress or active" iconName="dashboard" />
        <StatCard title="Last mobile sync" value={formatRelativeDate(dashboard.lastMobileSyncAt)} detail="Most recent mobile-backed telemetry sync" iconName="bell" />
        <StatCard title="Compliance posture" value={`${dashboard.currentCompliance}%`} detail="Latest compliance score synced from rider execution data" iconName="file" />
      </div>

      {dashboard.routes.length ? (
        <Card className="glass-card border-border/60">
          <CardHeader>
            <CardTitle>Assigned routes</CardTitle>
            <CardDescription>Route history, sync freshness, and compliance posture from the latest rider execution data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.routes.map((route) => (
              <Link key={route.id} href={`/dashboard/routes/${route.id}`} className="block rounded-xl border border-border/60 bg-background/70 p-4 transition-colors hover:border-primary/40">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{route.name}</p>
                      <Badge variant={route.status === "completed" ? "success" : route.status === "in-progress" ? "secondary" : "outline"} className="capitalize">
                        {route.status.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{route.complianceStatus}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{route.city || "City unavailable"}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Last synced {formatRelativeDate(route.lastSyncedAt)}</p>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground md:text-right">
                    <p>Progress {route.routeProgress}%</p>
                    <p>Coverage {route.coverageKm.toFixed(1)} km</p>
                    <p>Source {route.syncSource}</p>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No routes assigned"
          description="Route assignments will appear here after MOVRR operations and mobile dispatch sync them to your rider account."
          iconName="routes"
        />
      )}
    </div>
  );
}
