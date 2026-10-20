import Link from "next/link";
import { z } from "zod";
import { requireProductSession } from "@/lib/appUser";
import { platformFetch } from "@/lib/platform/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export default async function PartnerLocationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireProductSession(["rider"]);
  const p = await searchParams;
  const validation = z
    .object({
      south: z.coerce.number().min(-90).max(90),
      north: z.coerce.number().min(-90).max(90),
      west: z.coerce.number().min(-180).max(180),
      east: z.coerce.number().min(-180).max(180),
    })
    .refine(
      (x) =>
        x.south < x.north &&
        x.west < x.east &&
        x.north - x.south <= 0.5 &&
        x.east - x.west <= 0.5,
    )
    .safeParse({
      south: p.south ?? 52.25,
      north: p.north ?? 52.45,
      west: p.west ?? 4.75,
      east: p.east ?? 5.0,
    });
  const cursor = z.string().uuid().optional().safeParse(p.cursor);
  if (!validation.success || !cursor.success) return <div className="page-canvas space-y-6"><PageHeader title="Partner locations" description="Published MOVRR partner locations in your selected area."/><p role="alert">Search parameters are invalid. Choose valid south/north and west/east bounds, no more than 0.5 degrees apart, or reset the search.</p><Link className="text-primary" href="/dashboard/partners">Reset location search</Link></div>;
  const bounds = validation.data;
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(bounds).map(([k, v]) => [k, String(v)])),
    limit: "100",
    ...(cursor.data ? { cursor: cursor.data } : {}),
  });
  const page = z
    .object({
      locations: z.array(
        z
          .object({
            id: z.string().uuid(),
            name: z.string(),
            latitude: z.number(),
            longitude: z.number(),
          })
          .passthrough(),
      ),
      nextCursor: z.string().uuid().nullable(),
      complete: z.boolean(),
      fetchedAt: z.string(),
    })
    .parse(await platformFetch(`/partners/locations?${query}`));
  return (
    <div className="page-canvas space-y-6">
      <PageHeader
        title="Partner locations"
        description="Published MOVRR partner locations in your selected area."
      />
      <form className="grid gap-3 md:grid-cols-5">
        {Object.entries(bounds).map(([key, value]) => (
          <label key={key} className="capitalize">
            {key}
            <Input name={key} type="number" min={key === "south" || key === "north" ? -90 : -180} max={key === "south" || key === "north" ? 90 : 180} step="any" required defaultValue={value} />
          </label>
        ))}
        <Button type="submit">Find locations</Button>
      </form>
      {page.locations.map((l) => (
        <Card key={l.id}>
          <CardHeader>
            <CardTitle>{l.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {l.latitude}, {l.longitude}
            </p>
          </CardContent>
        </Card>
      ))}
      {!page.locations.length && <p>No published locations in this area.</p>}
      {page.nextCursor && (
        <Link
          href={`/dashboard/partners?${new URLSearchParams({ ...Object.fromEntries(Object.entries(bounds).map(([k, v]) => [k, String(v)])), cursor: page.nextCursor })}`}
        >
          Next locations
        </Link>
      )}
    </div>
  );
}
