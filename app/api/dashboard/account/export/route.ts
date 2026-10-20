import { NextResponse } from "next/server";
import { requireProductSession } from "@/lib/appUser";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isTrustedSameOriginRequest } from "@/lib/requestProtection";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const session = await requireProductSession(["rider"]);
  if (!session.riderProfile)
    return NextResponse.json({ error: "rider_profile_required" }, { status: 409 });
  const db = await createSupabaseServerClient();
  const specifications = [
    [
      "user",
      "id",
      session.authUser.id,
      "id,email,name,phone,avatar_url,status,created_at",
    ],
    [
      "rider",
      "id",
      session.riderProfile.id,
      "id,city,country,vehicle_type,emergency_contact,emergency_phone",
    ],
    ["user_preferences", "user_id", session.authUser.id, "*"],
    ["rider_route", "rider_id", session.riderProfile.id, "*"],
    ["ride_session", "rider_id", session.riderProfile.id, "*"],
    ["route_tracking", "rider_id", session.riderProfile.id, "*"],
    ["reward_transactions", "rider_id", session.riderProfile.id, "*"],
    ["reward_redemptions", "rider_id", session.riderProfile.id, "*"],
    ["rider_badge_award", "rider_id", session.riderProfile.id, "*"],
    ["rider_campaign_accessory_assignment", "rider_id", session.riderProfile.id, "*"],
    ["rider_brand_preference", "rider_id", session.riderProfile.id, "*"],
  ] as const;
  const data: Record<string, unknown[]> = {};
  try {
    for (const [table, key, id, columns] of specifications) {
      const rows: unknown[] = [];
      let cursor: string | undefined;
      do {
        let query = db.from(table).select(columns).eq(key, id).order("id").limit(500);
        if (cursor) query = query.gt("id", cursor);
        const page = await query;
        if (page.error) throw page.error;
        rows.push(...(page.data ?? []));
        cursor =
          page.data?.length === 500
            ? String((page.data.at(-1) as unknown as { id: string }).id)
            : undefined;
      } while (cursor);
      data[table] = rows;
    }
  } catch {
    return NextResponse.json(
      { error: "export_unavailable_no_partial_export_returned" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return new NextResponse(
    JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="movrr-personal-data.json"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
