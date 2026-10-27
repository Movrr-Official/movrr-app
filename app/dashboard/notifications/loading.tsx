import { PartnerLoadingBoundary } from "@/components/partner/PartnerLoadingBoundary";
import { RouteLoading } from "@/components/shared/RouteLoading";

export default function DashboardNotificationsLoading() {
  return <PartnerLoadingBoundary screen="notifications"><RouteLoading withCards={false} /></PartnerLoadingBoundary>;
}
