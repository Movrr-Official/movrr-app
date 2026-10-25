"use client";
import { RouteLoading } from "@/components/shared/RouteLoading";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSession } from "@/providers/SessionProvider";
import { partnerText } from "@/lib/partnerLocale";
export default function DashboardLoading() {
  const session = useAppSession();
  if (session.role !== "partner") return <RouteLoading />;
  return <div role="status" aria-busy="true" className="space-y-6"><span className="sr-only">{partnerText(session.partnerLocale ?? "en", "Loading your workspace")}</span><div className="space-y-3"><Skeleton className="h-8 w-64 max-w-full"/><Skeleton className="h-4 w-80 max-w-full"/></div><Skeleton className="h-64 w-full rounded-xl"/><div className="grid grid-cols-3 gap-3">{[0,1,2].map(key=><Skeleton key={key} className="h-28 rounded-xl"/>)}</div><div className="grid gap-3 xl:grid-cols-3">{[0,1,2].map(key=><Skeleton key={key} className="h-20 rounded-xl"/>)}</div></div>;
}
