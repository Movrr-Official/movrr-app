import { PartnerLoadingBoundary } from "@/components/partner/PartnerLoadingBoundary";
import { RouteLoading } from "@/components/shared/RouteLoading";

export default function DashboardSettingsLoading() {
  return <PartnerLoadingBoundary screen="settings"><RouteLoading withCards={false} /></PartnerLoadingBoundary>;
}
