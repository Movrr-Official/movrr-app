import Link from "next/link";
import { listRideSummaries } from "@/lib/platform/riderSelfService";
import { requireProductSession } from "@/lib/appUser";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RideRewardStatus } from "@/components/rider/RideRewardStatus";
export default async function RidesPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const session = await requireProductSession(["rider"]);
  const page = await listRideSummaries((await searchParams).cursor);
  return (
    <div className="page-canvas space-y-6">
      <PageHeader
        title="Ride history"
        description="Recorded rides, verification and committed MOVRR Points."
      />
      {page.summaries.map((s) => (
        <Card key={s.rideSessionId}>
          <CardHeader>
            <CardTitle>
              <Link href={`/dashboard/rides/${s.rideSessionId}`}>
                {s.session.route_name ||
                  (s.session.earning_mode === "ad_enhanced_ride"
                    ? "Boosted ride"
                    : "Standard ride")}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              {s.session.status} /{" "}
              {s.session.verification_result?.status ??
                "Verification unavailable"}
            </p>
            <p>
              {s.session.total_distance_meters == null
                ? "Distance unavailable"
                : `${(s.session.total_distance_meters / 1000).toFixed(1)} km`}
            </p>
            <RideRewardStatus
              summary={s}
              locale={
                session.appUser.languagePreference === "nl-NL" ? "nl" : "en"
              }
            />
          </CardContent>
        </Card>
      ))}
      {!page.summaries.length && <p>No recorded rides.</p>}
      {page.nextCursor && (
        <Link
          className="text-primary"
          href={`/dashboard/rides?cursor=${encodeURIComponent(Buffer.from(JSON.stringify(page.nextCursor)).toString("base64url"))}`}
        >
          Older rides
        </Link>
      )}
    </div>
  );
}
