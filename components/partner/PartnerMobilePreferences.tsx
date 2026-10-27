"use client";
import { usePartnerMobile } from "@/lib/usePartnerMobile";
import { PartnerAppStatus } from "./PartnerAppStatus";
import type { PartnerLocale } from "@/lib/partnerLocale";

/** Preferences belong to Account in the mobile app; the desktop controls stay intact. */
export function PartnerMobilePreferences({ locale }: { locale: PartnerLocale }) {
  const mobile = usePartnerMobile();
  return mobile ? <div className="partner-account-preferences"><PartnerAppStatus locale={locale} presentation="mobile-account" /></div> : null;
}
