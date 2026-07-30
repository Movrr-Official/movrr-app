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
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";

export default async function GovernmentCompliancePage() {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "government") redirect("/dashboard");

  let summary: Awaited<
    ReturnType<typeof getGovernmentProgrammes>
  >["complianceSummary"] | null = null;
  let error: string | null = null;

  try {
    const data = await getGovernmentProgrammes();
    summary = data.complianceSummary;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load compliance data";
  }

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Compliance"
          description="Ride verification and compliance summary for government oversight."
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {summary ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatsCard
                title="Verified rides"
                value={summary.verifiedRides}
                description="Rides passing verification checks"
                icon={CheckCircle2}
              />
              <StatsCard
                title="Pending review"
                value={summary.pendingReview}
                description="Rides awaiting compliance review"
                icon={Clock3}
              />
              <StatsCard
                title="Rejected rides"
                value={summary.rejectedRides}
                description="Rides failing verification"
                icon={AlertTriangle}
              />
            </div>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Compliance overview</CardTitle>
                <CardDescription>
                  Aggregated verification posture from Platform programme data.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="mt-2 text-2xl font-semibold">{summary.verifiedRides}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="mt-2 text-2xl font-semibold">{summary.pendingReview}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="mt-2 text-2xl font-semibold">{summary.rejectedRides}</p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <EmptyState
            title="Compliance data unavailable"
            description="Compliance summaries will appear when Platform returns programme data."
            iconName="file"
          />
        )}
      </div>
    </div>
  );
}
