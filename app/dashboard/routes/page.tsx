import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/stats/StatsCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProductSession } from "@/lib/appUser";
import { formatRelativeDate } from "@/lib/format";
import { getRiderDashboardData } from "@/services/rider";
import { redirect } from "next/navigation";
import { Bell, FileText, MapPinned, Route, Smartphone } from "lucide-react";

export default async function DashboardRoutesPage() {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "rider") redirect("/dashboard");

  const dashboard = await getRiderDashboardData();

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
          <StatsCard
            title="Assigned routes"
            value={dashboard.routes.length}
            description="Route assignments visible in your web workspace"
            icon={Route}
          />
          <StatsCard
            title="Active routes"
            value={dashboard.activeRoutes}
            description="Assignments currently in progress or active"
            icon={MapPinned}
          />
          <StatsCard
            title="Last mobile sync"
            value={formatRelativeDate(dashboard.lastMobileSyncAt)}
            description="Most recent mobile-backed telemetry sync"
            icon={Bell}
          />
          <StatsCard
            title="Compliance posture"
            value={`${dashboard.currentCompliance}%`}
            description="Latest compliance score synced from rider execution data"
            icon={FileText}
          />
        </div>

        {dashboard.routes.length ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Assigned routes</CardTitle>
              <CardDescription>
                Route history, verification status, sync freshness, and compliance
                posture from the latest rider execution data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.routes.map((route) => (
                <div
                  key={route.id}
                  className="rounded-xl border border-border/60 bg-background/70 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/dashboard/routes/${route.id}`}
                        className="block transition-colors hover:text-primary"
                      >
                        <div className="flex items-center gap-3">
                          <p className="font-semibold">{route.name}</p>
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
                          <Badge variant="outline" className="capitalize">
                            {route.complianceStatus}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {route.city || "City unavailable"}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Last synced {formatRelativeDate(route.lastSyncedAt)}
                        </p>
                      </Link>
                      {(route.status === "assigned" ||
                        route.status === "in-progress") && (
                        <a
                          href={`movrrapp://routes/${route.id}`}
                          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                          <Smartphone className="h-4 w-4" />
                          Continue in MOVRR app
                        </a>
                      )}
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground md:text-right">
                      <p>Progress {route.routeProgress}%</p>
                      <p>Coverage {route.coverageKm.toFixed(1)} km</p>
                      <p>Verification {route.complianceStatus}</p>
                    </div>
                  </div>
                </div>
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
    </div>
  );
}
