import Link from "next/link";
import { ArrowRight, CheckCheck, Gift, Package, ScanLine, Check } from "lucide-react";
import { partnerText, type PartnerLocale } from "@/lib/partnerLocale";
import { capabilitiesForMembershipRole } from "@/lib/platform/capabilities";
import type { PartnerDashboard } from "@/schemas";

export function PartnerMobileHome({ dashboard, locale }: { dashboard: PartnerDashboard; locale: PartnerLocale }) {
  const t = (text: string) => partnerText(locale, text);
  const capabilities = capabilitiesForMembershipRole(dashboard.membershipRole);
  const number = (value: number) => value.toLocaleString(locale === "nl" ? "nl-NL" : "en-GB");
  return <div className="partner-mobile-home partner-desk-screen">
    <div className="partner-screen-title"><p>{t("Home")}</p><h1>{t("Welcome back")}</h1><span>{t("A smooth handover starts with a scan.")}</span></div>
    {capabilities.includes("fulfilment.validate") && <Link href="/dashboard/validate" className="partner-desk-scan"><ScanLine size={24} aria-hidden="true" /><span><strong>{t("Scan a reward")}</strong><span>{t("Quick to check. Easy to hand over.")}</span></span><ArrowRight size={20} aria-hidden="true" /></Link>}
    <section className="partner-queue-summary" aria-labelledby="mobile-collections">
      <div className="partner-section-label"><h2 id="mobile-collections">{t("Collections")}</h2><Link href="/dashboard/collections">{t("View all")}<ArrowRight size={14} aria-hidden="true" /></Link></div>
      {dashboard.pendingCount === 0 && dashboard.validatedCount === 0 ? <div className="partner-home-clear"><span><Check size={20} aria-hidden="true" /></span><div><h3>{t("You're all caught up")}</h3><p>{t("Rewards ready for collection will appear here.")}</p></div></div> : <>
        <Link href="/dashboard/collections" className="partner-queue-line"><span>{t("Pending collections")}</span><strong>{number(dashboard.pendingCount)}</strong><ArrowRight size={16} aria-hidden="true" /></Link>
        <Link href="/dashboard/collections" className="partner-queue-line"><span className="partner-status-dot" aria-hidden="true" /><span>{t("Ready for handover")}</span><strong>{number(dashboard.validatedCount)}</strong><ArrowRight size={16} aria-hidden="true" /></Link>
      </>}
      <Link href="/dashboard/collections?view=history" className="partner-queue-line"><CheckCheck size={18} aria-hidden="true" /><span>{t("Collections completed")}</span><strong>{number(dashboard.completedCount)}</strong><ArrowRight size={16} aria-hidden="true" /></Link>
    </section>
    <section aria-labelledby="mobile-manage"><div className="partner-section-label"><h2 id="mobile-manage">{t("Your offering")}</h2></div><div className="partner-desk-shortcuts">
      <Link href="/dashboard/rewards"><Gift size={22} aria-hidden="true" /><strong>{t("Rewards")}</strong><span>{t("Catalog and availability")}</span><ArrowRight size={16} aria-hidden="true" /></Link>
      {capabilities.includes("resources.manage") && <Link href="/dashboard/resources"><Package size={22} aria-hidden="true" /><strong>{t("Inventory")}</strong><span>{t("Voucher codes")}</span><ArrowRight size={16} aria-hidden="true" /></Link>}
    </div></section>
  </div>;
}
