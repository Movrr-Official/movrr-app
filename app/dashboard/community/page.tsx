import {
  createCommunityRideAction,
  joinCommunityRideAction,
} from "@/app/actions/rider";
import { StatusToast } from "@/components/form/StatusToast";
import { SubmitButton } from "@/components/form/SubmitButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProductSession } from "@/lib/appUser";
import { listCommunityRides } from "@/lib/platform/communityPlatform";
import { formatRelativeDate } from "@/lib/format";
import { redirect } from "next/navigation";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "rider") redirect("/dashboard");

  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : null;
  const error = typeof params.error === "string" ? params.error : null;

  let rides: Awaited<ReturnType<typeof listCommunityRides>> = [];
  let loadError: string | null = null;
  try {
    rides = await listCommunityRides();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load community rides";
  }

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Community"
          description="List, create, and join community rides via Platform API."
        />
        <StatusToast success={success} error={error ?? loadError} />

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Create community ride</CardTitle>
            <CardDescription>
              POST /api/v1/community-rides — organiser must have an active rider profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCommunityRideAction} className="grid gap-4 md:grid-cols-2">
              <Input name="title" placeholder="Ride title" required />
              <Input name="scheduledAt" type="datetime-local" required />
              <Input name="meetingPoint" placeholder="Meeting point" className="md:col-span-2" />
              <Input name="category" placeholder="Category (e.g. social)" />
              <Input name="maxParticipants" type="number" placeholder="Max participants" defaultValue={20} />
              <Textarea
                name="description"
                placeholder="Description"
                className="md:col-span-2"
              />
              <SubmitButton type="submit" pendingLabel="Creating">
                Create ride
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        {rides.length ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Upcoming rides</CardTitle>
              <CardDescription>
                Join community rides open for participation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rides.map((ride) => (
                <div
                  key={ride.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{ride.title}</p>
                      {ride.status ? (
                        <Badge variant="outline" className="capitalize">
                          {ride.status}
                        </Badge>
                      ) : null}
                    </div>
                    {ride.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {ride.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatRelativeDate(ride.scheduledAt ?? null)}
                      {ride.meetingPoint ? ` · ${ride.meetingPoint}` : ""}
                    </p>
                  </div>
                  <form action={joinCommunityRideAction}>
                    <input type="hidden" name="communityRideId" value={ride.id} />
                    <SubmitButton type="submit" variant="outline" pendingLabel="Joining">
                      Join ride
                    </SubmitButton>
                  </form>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="No community rides yet"
            description="Create a ride or check back when other riders publish upcoming events."
            iconName="dashboard"
          />
        )}
      </div>
    </div>
  );
}
