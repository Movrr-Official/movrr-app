import { PartnerLoadingBoundary } from "@/components/partner/PartnerLoadingBoundary";
import ExistingLoading from "@/app/dashboard/rewards/loading";
export default function Loading() {
  return <PartnerLoadingBoundary screen="reward-edit"><ExistingLoading /></PartnerLoadingBoundary>;
}
