import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/stats/StatsCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getGovernmentProgrammes } from "@/lib/platform/governmentPlatform";
import { getCurrentProductSession } from "@/lib/appUser";
import { redirect } from "next/navigation";
import { LineChart, Megaphone, ShieldCheck } from "lucide-react";

export default async function GovernmentImpactPage() {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "government") redirect("/dashboard");

  let data: Awaited<ReturnType<typeof getGovernmentProgrammes>> | null = null;
  let error: string | null = null;

  try {
    data = await getGovernmentProgrammes();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load impact data";
  }

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Impact"
          description="Programme impact KPIs — impressions, verified rides, and campaign reach."
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {data ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
              <StatsCard
                title="Active campaigns"
                value={data.kpis.activeCampaigns}
                description="Campaigns delivering impact"
                icon={Megaphone}
              />
              <StatsCard
                title="Total impressions"
                value={data.kpis.totalImpressions}
                description="Aggregate impression volume"
                icon={LineChart}
              />
              <StatsCard
                title="Verified rides"
                value={data.kpis.verifiedRides}
                description="Verified ride sessions"
                icon={ShieldCheck}
              />
              <StatsCard
                title="Campaign records"
                value={data.campaigns.length}
                description="Programme-linked campaigns"
                icon={LineChart}
              />
            </div>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Impact summary</CardTitle>
                <CardDescription>
                  High-level programme outcomes from GET /api/v1/government/programmes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {data.kpis.totalImpressions} total impressions across{" "}
                  {data.kpis.activeCampaigns} active campaigns, with{" "}
                  {data.kpis.verifiedRides} verified rides contributing to programme
                  outcomes.
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <EmptyState
            title="Impact data unavailable"
            description="Impact metrics will appear when Platform returns programme data."
            iconName="dashboard"
          />
        )}
      </div>
    </div>
  );
}
