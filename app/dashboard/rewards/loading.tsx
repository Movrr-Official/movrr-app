import { PartnerLoadingBoundary } from "@/components/partner/PartnerLoadingBoundary";
import { RouteLoading } from "@/components/shared/RouteLoading";

export default function DashboardRewardsLoading() {
  return <PartnerLoadingBoundary screen="rewards"><RouteLoading withCards={false} /></PartnerLoadingBoundary>;
}
