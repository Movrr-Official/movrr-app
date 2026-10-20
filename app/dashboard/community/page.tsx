import { randomUUID } from "node:crypto";
import { StatusToast } from "@/components/form/StatusToast";
import { SubmitButton } from "@/components/form/SubmitButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProductSession } from "@/lib/appUser";
import { listCommunityRides } from "@/lib/platform/communityPlatform";
import { CommunityActionForm } from "@/components/rider/CommunityActionForm";
import { CommunityFields } from "@/components/rider/CommunityFields";
export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requireProductSession(["rider"]);
  const params = await searchParams;
  const rides = await listCommunityRides();
  return (
    <div key={session.appUser.id} className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Community"
          description="Create, join and manage community rides."
        />
        <StatusToast success={params.success ?? null} error={params.error ?? null} />
        <Card>
          <CardHeader>
            <CardTitle>Create community ride</CardTitle>
          </CardHeader>
          <CardContent>
            <CommunityActionForm
              key={session.appUser.id}
              create
              operationId={randomUUID()}
              accountId={session.appUser.id}
              className="grid gap-4 md:grid-cols-2"
            >
              <input type="hidden" name="action" value="create" />
              <CommunityFields />
              <SubmitButton pendingLabel="Creating">Create ride</SubmitButton>
            </CommunityActionForm>
          </CardContent>
        </Card>
        {rides.map((ride) => (
          <Card key={ride.id}>
            <CardHeader>
              <CardTitle>{ride.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{ride.description}</p>
              <p>
                {new Date(ride.scheduled_at).toLocaleString("en-GB", {
                  timeZone: "Europe/Amsterdam",
                  timeZoneName: "short",
                })}{" "}
                / {ride.meeting_point_name}
              </p>
              <p>
                {ride.status} / {ride.isJoined ? "Joined" : "Not joined"}
              </p>
              {!ride.isOrganizer && (
                <CommunityActionForm accountId={session.appUser.id}>
                  <input type="hidden" name="id" value={ride.id} />
                  <input
                    type="hidden"
                    name="action"
                    value={ride.isJoined ? "leave" : "join"}
                  />
                  <SubmitButton pendingLabel="Updating">
                    {ride.isJoined ? "Leave ride" : "Join ride"}
                  </SubmitButton>
                </CommunityActionForm>
              )}
              {ride.isOrganizer && (
                <>
                  <details>
                    <summary className="cursor-pointer">Edit your ride</summary>
                    <CommunityActionForm accountId={session.appUser.id} className="mt-4 grid gap-4 md:grid-cols-2">
                      <input type="hidden" name="action" value="edit" />
                      <input type="hidden" name="id" value={ride.id} />
                      <input
                        type="hidden"
                        name="expectedUpdatedAt"
                        value={ride.updated_at}
                      />
                      <CommunityFields ride={ride} />
                      <SubmitButton pendingLabel="Saving">Save changes</SubmitButton>
                    </CommunityActionForm>
                  </details>
                  <CommunityActionForm accountId={session.appUser.id}>
                    <input type="hidden" name="id" value={ride.id} />
                    <input type="hidden" name="action" value="cancel" />
                    <input
                      type="hidden"
                      name="expectedUpdatedAt"
                      value={ride.updated_at}
                    />
                    <SubmitButton variant="outline" pendingLabel="Cancelling">
                      Cancel ride
                    </SubmitButton>
                  </CommunityActionForm>
                </>
              )}
            </CardContent>
          </Card>
        ))}
        {!rides.length && <p>No upcoming community rides.</p>}
      </div>
    </div>
  );
}
