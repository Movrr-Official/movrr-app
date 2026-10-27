import Link from "next/link";
import { ArrowRight, ChevronRight, Inbox, ScanLine } from "lucide-react";
import type { PartnerPendingFulfilment } from "@/schemas";
import { partnerText, type PartnerLocale } from "@/lib/partnerLocale";
import { partnerLabel } from "@/lib/partnerPresentation";

export function PartnerMobileActivity({ items, history, canScan, locale }: { items: PartnerPendingFulfilment[]; history: boolean; canScan: boolean; locale: PartnerLocale }) {
  const t = (text: string) => partnerText(locale, text);
  const formatter = new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", { dateStyle: "medium", timeZone: "Europe/Amsterdam" });
  return <div className="partner-desk-screen partner-activity-screen">
    <div className="partner-screen-title"><p>{t("Collections")}</p><h1>{t("Activity")}</h1><span>{t("Every handover, in one place.")}</span></div>
    <nav className="partner-activity-filters" aria-label={t("Collections")}><Link href="/dashboard/collections" aria-current={!history ? "page" : undefined}>{t("Pending collections")}</Link><Link href="/dashboard/collections?view=history" aria-current={history ? "page" : undefined}>{t("Collection history")}</Link></nav>
    {!items.length ? <div className="partner-desk-empty"><Inbox size={32} aria-hidden="true" /><h2>{t(history ? "No collection history available" : "Your queue is clear")}</h2><p>{t(history ? "Completed and cancelled rewards will appear here." : canScan ? "Rewards waiting to be collected will appear here. Scan a rider's QR code to begin." : "Rewards ready for collection will appear here.")}</p>{!history && canScan && <Link href="/dashboard/validate">{t("Scan a reward")}<ArrowRight size={16} aria-hidden="true" /></Link>}</div> : <>
      <div className="partner-list-caption"><span>{t(history ? "Collection history" : "Collection queue")}</span><span>{items.length.toLocaleString(locale === "nl" ? "nl-NL" : "en-GB")}</span></div>
      <ul className="partner-activity-list">{items.map(item => {
        const rawDate = history ? item.updatedAt ?? item.createdAt : item.createdAt;
        const date = rawDate ? new Date(rawDate) : null;
        return <li key={item.id}><Link href={`/dashboard/collections/${item.id}`}><span className="partner-activity-symbol"><ScanLine size={20} aria-hidden="true" /></span><span className="partner-activity-copy"><strong>{item.rewardTitle ?? t("Reward collection")}</strong>{item.state && <span className="partner-activity-status" data-state={item.state}>{partnerLabel(item.state, locale)}</span>}<span className="partner-activity-meta"><span>{partnerLabel(item.fulfilmentType, locale)}</span>{date && !Number.isNaN(date.getTime()) && <time dateTime={rawDate!}>{formatter.format(date)}</time>}</span></span><ChevronRight className="partner-activity-chevron" size={18} aria-hidden="true" /></Link></li>;
      })}</ul>
    </>}
  </div>;
}
