import { NextResponse } from "next/server";
import { requireProductSession } from "@/lib/appUser";
import { isTrustedSameOriginRequest } from "@/lib/requestProtection";
import { getRiderDashboardData } from "@/services/rider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function escapeCsv(value: string | number) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: { "cache-control": "no-store" } });
  }

  await requireProductSession(["rider"]);
  const dashboard = await getRiderDashboardData();

  const header = ["description", "type", "category", "statement_points", "created_at"];
  const rows = dashboard.rewards.map((reward) => [
    reward.description,
    reward.type,
    reward.category,
    reward.type === "redeemed" ? -Math.abs(reward.points) : reward.points,
    reward.createdAt,
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="movrr-rider-rewards-statement.csv"',
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
