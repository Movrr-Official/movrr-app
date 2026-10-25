import Link from "next/link";
import { ArrowRight, CheckCheck, ClipboardList, Gift, Package, ScanLine } from "lucide-react";
import { partnerText, type PartnerLocale } from "@/lib/partnerLocale";
import { capabilitiesForMembershipRole } from "@/lib/platform/capabilities";
import type { PartnerDashboard } from "@/schemas";

export function PartnerMobileHome({ dashboard, locale }: { dashboard: PartnerDashboard; locale: PartnerLocale }) {
  const t = (text: string) => partnerText(locale, text);
  const capabilities = capabilitiesForMembershipRole(dashboard.membershipRole);
  const number = (value: number) => value.toLocaleString(locale === "nl" ? "nl-NL" : "en-GB");
  return <div className="partner-mobile-home">
    <div className="partner-app-intro"><p>{t("Your workspace. Your next move.")}</p><h1>{t("Ready for the next rider?")}</h1></div>
    {capabilities.includes("fulfilment.validate") && <Link href="/dashboard/validate" className="partner-scan-launch"><span className="partner-scan-symbol"><ScanLine size={32} aria-hidden="true" /></span><span><strong>{t("Scan a reward")}</strong><span>{t("Check the QR. Confirm the handover.")}</span></span><ArrowRight size={22} aria-hidden="true" /></Link>}
    <section aria-labelledby="mobile-collections"><div className="partner-app-section-heading"><h2 id="mobile-collections">{t("Collections")}</h2><Link href="/dashboard/collections">{t("View all")}<ArrowRight size={16} aria-hidden="true" /></Link></div>
      <div className="partner-operation-grid">{[{ label: "Pending collections", count: dashboard.pendingCount, Icon: ClipboardList }, { label: "Ready for handover", count: dashboard.validatedCount, Icon: Package }].map(({ label, count, Icon }) => <Link href="/dashboard/collections" className="partner-operation-card" key={label}><Icon size={22} aria-hidden="true" /><strong>{number(count)}</strong><span>{t(label)}</span></Link>)}</div>
      <Link href="/dashboard/collections?view=history" className="partner-completed-row"><CheckCheck size={22} aria-hidden="true" /><span>{t("Collections completed")}</span><strong>{number(dashboard.completedCount)}</strong><ArrowRight size={18} aria-hidden="true" /></Link>
    </section>
    <section aria-labelledby="mobile-manage"><div className="partner-app-section-heading"><h2 id="mobile-manage">{t("Make it yours")}</h2></div><div className="partner-app-list">
      <Link href="/dashboard/rewards" className="partner-app-list-row"><Gift aria-hidden="true" /><span><strong>{t("Rewards")}</strong><span>{t("Shape what riders can look forward to.")}</span></span><ArrowRight size={18} aria-hidden="true" /></Link>
      {capabilities.includes("resources.manage") && <Link href="/dashboard/resources" className="partner-app-list-row"><Package aria-hidden="true" /><span><strong>{t("Inventory")}</strong><span>{t("Keep your voucher codes ready to go.")}</span></span><ArrowRight size={18} aria-hidden="true" /></Link>}
    </div></section>
  </div>;
}
