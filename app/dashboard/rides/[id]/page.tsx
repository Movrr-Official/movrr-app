import { getRideSummary } from "@/lib/platform/riderSelfService";
import { requireProductSession } from "@/lib/appUser";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
export default async function RidePage({ params }: { params: Promise<{ id: string }> }) {
  await requireProductSession(["rider"]);
  const summary = await getRideSummary((await params).id);
  if (!summary) notFound();
  return (
    <div className="page-canvas space-y-6">
      <PageHeader
        title={summary.session.route_name || "Ride detail"}
        description="Authoritative ride and settlement status."
      />
      <Card>
        <CardHeader>
          <CardTitle>{summary.session.status}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Verification: {summary.session.verification_result?.status ?? "Unavailable"}
          </p>
          <p>Committed points: {summary.committedPoints ?? "Unavailable"}</p>
          <p>
            Settlement: {summary.settlement.status} /{" "}
            {summary.settlement.completeness ?? "Unresolved"}
          </p>
          <p>{summary.settlement.reason_code?.replaceAll("_", " ")}</p>
          <p>
            Distance:{" "}
            {summary.session.total_distance_meters == null
              ? "Unavailable"
              : `${(summary.session.total_distance_meters / 1000).toFixed(1)} km`}
          </p>
          <p>
            Started:{" "}
            {new Date(summary.session.started_at).toLocaleString("en-GB", {
              timeZone: "Europe/Amsterdam",
            })}
          </p>
          <p>
            Completed:{" "}
            {summary.session.completed_at
              ? new Date(summary.session.completed_at).toLocaleString("en-GB", {
                  timeZone: "Europe/Amsterdam",
                })
              : "Not completed"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
