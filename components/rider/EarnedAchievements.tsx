import { z } from "zod";
import { requireProductSession } from "@/lib/appUser";
import { readRiderFeature } from "@/lib/platform/riderSelfService";
import { riderSelfServiceAction } from "@/app/actions/riderSelfService";
import { SubmitButton } from "@/components/form/SubmitButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
const award = z.object({
  id: z.string().uuid(),
  awarded_at: z.string(),
  badge: z.object({
    id: z.string().uuid(),
    code: z.string(),
    short_label: z.string(),
    description: z.string().nullable(),
  }),
});
export async function EarnedAchievements() {
  const session = await requireProductSession(["rider"]);
  const awards = z.array(award).parse(await readRiderFeature("achievements"));
  return (
      <Card>
        <CardHeader>
          <CardTitle>Earned achievements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {awards.map((a) => (
            <div key={a.id} className="rounded-xl border p-4">
              <p className="font-semibold">{a.badge.short_label}</p>
              <p>{a.badge.description}</p>
              <p className="text-sm">
                Awarded{" "}
                {new Date(a.awarded_at).toLocaleDateString("en-GB", {
                  timeZone: "Europe/Amsterdam",
                })}
              </p>
            </div>
          ))}
          {!awards.length && <p>No achievements awarded yet.</p>}
          <form action={riderSelfServiceAction}>
            <input type="hidden" name="accountId" value={session.appUser.id}/><input type="hidden" name="feature" value="achievements" />
            <SubmitButton pendingLabel="Refreshing">
              Refresh achievement progress
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
  );
}
