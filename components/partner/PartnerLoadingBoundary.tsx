"use client";
import type { ReactNode } from "react";
import { useAppSession } from "@/providers/SessionProvider";
import { usePartnerMobile } from "@/lib/usePartnerMobile";
import { PartnerMobileLoading, type PartnerLoadingScreen } from "./PartnerMobileLoading";

/** Keep the existing desktop and other product-role fallbacks exactly as supplied. */
export function PartnerLoadingBoundary({ screen, children }: { screen: PartnerLoadingScreen; children: ReactNode }) {
  const session = useAppSession(), mobile = usePartnerMobile();
  return session.role === "partner" && mobile ? <PartnerMobileLoading screen={screen} locale={session.partnerLocale ?? "en"} /> : children;
}
