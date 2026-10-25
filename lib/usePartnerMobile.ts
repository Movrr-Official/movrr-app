"use client";
import { useSyncExternalStore } from "react";
// Browser and installed phones get the same product, without UA sniffing.
// Wide installed windows retain management UI. Camera selection stays stricter.
export const PARTNER_MOBILE_QUERY = "(max-width: 1023px)";
function subscribe(change: () => void) {
  const media = window.matchMedia(PARTNER_MOBILE_QUERY);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
export function usePartnerMobile() {
  // The existing responsive shell is the functional server-rendered fallback.
  return useSyncExternalStore(subscribe, () => window.matchMedia(PARTNER_MOBILE_QUERY).matches, () => false);
}
