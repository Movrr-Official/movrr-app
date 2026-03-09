import { NextRequest, NextResponse } from "next/server";
import { requireProductSession } from "@/lib/appUser";
import { isTrustedSameOriginRequest } from "@/lib/requestProtection";
import type { AdvertiserAnalyticsRange } from "@/schemas";
import { getAdvertiserDashboardData } from "@/services/advertiser";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function escapeCsv(value: string | number) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function POST(request: NextRequest) {
  if (!isTrustedSameOriginRequest(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: { "cache-control": "no-store" } });
  }

  await requireProductSession(["advertiser"]);
  const formData = await request.formData();
  const rangeParam = formData.get("range");
  const range: AdvertiserAnalyticsRange =
    rangeParam === "30d" || rangeParam === "12m" ? rangeParam : "90d";
  const dashboard = await getAdvertiserDashboardData(range);

  const header = ["label", "impressions", "qr_scans"];
  const rows = dashboard.analytics.trendSeries.map((point) => [
    point.label,
    point.impressions,
    point.qrScans,
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="movrr-advertiser-analytics-${range}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: "POST, OPTIONS" },
  });
}
