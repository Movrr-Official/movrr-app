import { PartnerLoadingBoundary } from "@/components/partner/PartnerLoadingBoundary";
import ExistingLoading from "@/app/dashboard/loading";
export default function Loading() {
  return <PartnerLoadingBoundary screen="scan"><ExistingLoading /></PartnerLoadingBoundary>;
}
