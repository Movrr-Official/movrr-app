import { PartnerLoadingBoundary } from "@/components/partner/PartnerLoadingBoundary";
import { RouteLoading } from "@/components/shared/RouteLoading";

export default function DashboardAnalyticsLoading() {
  return <PartnerLoadingBoundary screen="performance"><RouteLoading /></PartnerLoadingBoundary>;
}
