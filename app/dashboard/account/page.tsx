import { z } from "zod";
import { requireProductSession } from "@/lib/appUser";
import { readRiderFeature } from "@/lib/platform/riderSelfService";
import { riderSelfServiceAction } from "@/app/actions/riderSelfService";
import { SubmitButton } from "@/components/form/SubmitButton";
import { StatusToast } from "@/components/form/StatusToast";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
const accessory = z.object({
  id: z.string().uuid(),
  asset_code: z.string().nullable().optional(),
  campaign_name: z.string().nullable(),
  accessory_type_name: z.string(),
  status: z.string(),
  install_instructions: z.string().nullable(),
  return_instructions: z.string().nullable(),
  last_event_type: z.string().nullable(),
});
const brand = z.object({
  id: z.string().uuid(),
  display_name: z.string(),
  short_description: z.string(),
  values_summary: z.string(),
  rider_preference: z
    .array(z.object({ preference: z.enum(["preferred", "neutral", "avoided"]) }))
    .nullable(),
});
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
export default async function RiderAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await requireProductSession(["rider"]);
  const params = await searchParams;
  const raw = await Promise.all([
    readRiderFeature("accessories"),
    readRiderFeature("brands"),
    readRiderFeature("achievements"),
    readRiderFeature("impact"),
  ]);
  const accessories = z.array(accessory).parse(raw[0]),
    brands = z.array(brand).parse(raw[1]),
    awards = z.array(award).parse(raw[2]);
  const impact = z
    .array(
      z.object({
        total_rides: z.coerce.number(),
        total_distance_km: z.coerce.number(),
        co2_saved_kg: z.coerce.number(),
      }),
    )
    .parse(raw[3])[0];
  return (
    <div key={session.appUser.id} className="page-canvas space-y-6">
      <PageHeader
        title="Rider self-service"
        description="Your equipment, preferences, earned achievements and recorded impact."
      />
      <StatusToast error={params.error} success={params.success} />
      <Card>
        <CardHeader>
          <CardTitle>Campaign equipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {accessories.map((a) => (
            <div key={a.id} className="rounded-xl border p-4 space-y-3">
              <p className="font-semibold">
                {a.accessory_type_name} / {a.asset_code}
              </p>
              <p>
                {a.campaign_name} / {a.status}
              </p>
              <p>{a.install_instructions}</p>
              <p>{a.return_instructions}</p>
              {!["returned", "cancelled", "lost"].includes(a.status) && (
                <form action={riderSelfServiceAction} className="space-y-3">
                  <input type="hidden" name="accountId" value={session.appUser.id}/><input type="hidden" name="feature" value="accessories" />
                  <input type="hidden" name="id" value={a.id} />
                  <label>
                    Equipment action
                    <select name="action" className="ml-3 rounded border p-2">
                      {["assigned", "ready_for_install"].includes(a.status) && (
                        <option value="installed">Confirm installation</option>
                      )}
                      <option value="issue_reported">Report issue</option>
                      <option value="damaged">Report damage</option>
                      <option value="missing">Report missing</option>
                      <option value="lost">Report lost</option>
                    </select>
                  </label>
                  <label className="block">
                    Issue details
                    <Input name="note" maxLength={2000} />
                  </label>
                  <SubmitButton pendingLabel="Updating">Update equipment</SubmitButton>
                </form>
              )}
            </div>
          ))}
          {!accessories.length && <p>No equipment assigned.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Brand preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {brands.map((b) => (
            <div key={b.id} className="rounded-xl border p-4 space-y-3">
              <p className="font-semibold">{b.display_name}</p>
              <p>{b.short_description}</p>
              <p className="text-sm">{b.values_summary}</p>
              <form
                action={riderSelfServiceAction}
                className="flex flex-wrap items-center gap-3"
              >
                <input type="hidden" name="accountId" value={session.appUser.id}/><input type="hidden" name="feature" value="brands" />
                <input type="hidden" name="id" value={b.id} />
                <label>
                  Preference
                  <select
                    className="ml-3 rounded border p-2"
                    name="preference"
                    defaultValue={b.rider_preference?.[0]?.preference ?? "neutral"}
                  >
                    <option value="preferred">Preferred</option>
                    <option value="neutral">Neutral</option>
                    <option value="avoided">Avoided</option>
                  </select>
                </label>
                <SubmitButton pendingLabel="Saving">Save preference</SubmitButton>
              </form>
            </div>
          ))}
          {!brands.length && <p>No published brands available.</p>}
        </CardContent>
      </Card>
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
      <Card>
        <CardHeader>
          <CardTitle>Recorded impact</CardTitle>
        </CardHeader>
        <CardContent>
          {impact ? (
            <>
              <p>
                {impact.total_rides} rides ? {impact.total_distance_km.toFixed(1)} km
              </p>
              <p>{impact.co2_saved_kg.toFixed(2)} kg CO2e WTW - equivalent car journey estimate</p>
              <p className="text-sm text-muted-foreground">
                Completed cycling distance verified in authoritative ride records.
                Average car comparison at 0.190 kg CO2e per vehicle-km (2026 edition,
                reference data 2025), not measured emissions avoided. Unsupported
                historical evidence is excluded. Method: MOVRR-NL-CAR-COMPARISON-2026-v2.
              </p>
            </>
          ) : (
            <p>Impact unavailable.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
