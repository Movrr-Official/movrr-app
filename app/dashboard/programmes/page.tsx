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
import { getGovernmentProgrammes } from "@/lib/platform/governmentPlatform";
import { redirect } from "next/navigation";
import { getCurrentProductSession } from "@/lib/appUser";
import { LineChart, Megaphone, ShieldCheck, Target } from "lucide-react";

export default async function GovernmentProgrammesPage() {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "government") redirect("/dashboard");

  let data: Awaited<ReturnType<typeof getGovernmentProgrammes>> | null = null;
  let error: string | null = null;
  try {
    data = await getGovernmentProgrammes();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load programmes";
  }

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Programmes"
          description="Government programme KPIs and linked campaigns from Platform."
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {data ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
              <StatsCard
                title="Active campaigns"
                value={data.kpis.activeCampaigns}
                description="Campaigns in active delivery"
                icon={Megaphone}
              />
              <StatsCard
                title="Total impressions"
                value={data.kpis.totalImpressions}
                description="Recorded impression volume"
                icon={LineChart}
              />
              <StatsCard
                title="Verified rides"
                value={data.kpis.verifiedRides}
                description="Rides passing verification"
                icon={ShieldCheck}
              />
              <StatsCard
                title="Pending verification"
                value={data.kpis.pendingVerification}
                description="Rides awaiting review"
                icon={Target}
              />
            </div>

            {data.campaigns.length ? (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Programme campaigns</CardTitle>
                  <CardDescription>
                    GET /api/v1/government/programmes — linked campaign records.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.campaigns.map((campaign) => (
                    <div
                      key={String(campaign.id)}
                      className="rounded-xl border border-border/60 p-4"
                    >
                      <p className="font-semibold">{String(campaign.name ?? campaign.id)}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {campaign.lifecycle_status || campaign.lifecycleStatus ? (
                          <Badge variant="outline" className="capitalize">
                            {String(
                              campaign.lifecycle_status ?? campaign.lifecycleStatus,
                            ).replace(/_/g, " ")}
                          </Badge>
                        ) : null}
                        {campaign.budget !== undefined ? (
                          <span>Budget {String(campaign.budget)}</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                title="No programme campaigns"
                description="Linked campaigns will appear when Platform returns programme data."
                iconName="megaphone"
              />
            )}
          </>
        ) : (
          <EmptyState
            title="Programmes unavailable"
            description="Unable to load government programme data from Platform."
            iconName="dashboard"
          />
        )}
      </div>
    </div>
  );
}
