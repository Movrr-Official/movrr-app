import Link from "next/link";
import { ArrowRight, Gift, Package, ScanLine, Users } from "lucide-react";
import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import { Button } from "@/components/ui/button";
import type { PartnerDashboard } from "@/schemas";
import { PartnerMobileHome } from "./PartnerMobileHome";

export async function PartnerOverview({ dashboard }: { dashboard: PartnerDashboard }) {
  const locale = await getPartnerLocale(), t = (text: string) => partnerText(locale, text);
  return <><PartnerMobileHome dashboard={dashboard} locale={locale} /><div className="partner-desktop-home space-y-6 sm:space-y-8">
    <div className="space-y-2"><h1 className="font-semibold">{t("Your workspace")}</h1><p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{t("Your rewards and customer collections.")}</p></div>
    <section className="partner-hero" aria-labelledby="partner-handover-title"><div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div className="space-y-3"><ScanLine className="size-8 text-movrr-accent" aria-hidden="true" /><h2 id="partner-handover-title" className="font-semibold">{t("Ready for the next rider?")}</h2><p>{t("Scan their QR code, check the reward, and confirm the handover.")}</p></div><div className="flex shrink-0 flex-col gap-3"><Button asChild className="min-h-12"><Link href="/dashboard/validate"><ScanLine aria-hidden="true" className="mr-2 size-5" />{t("Scan a reward")}</Link></Button><Link href="/dashboard/collections" className="inline-flex min-h-11 items-center justify-center gap-2 text-xs font-medium text-white/90">{t("View collections")}<ArrowRight className="size-4" aria-hidden="true" /></Link></div></div></section>
    <section aria-labelledby="partner-activity-title"><h2 id="partner-activity-title" className="mb-3 text-sm font-semibold">{t("At a glance")}</h2><dl className="partner-summary">{[{ label: "Pending collections", value: dashboard.pendingCount },{ label: "Ready for handover", value: dashboard.validatedCount },{ label: "Collections completed", value: dashboard.completedCount }].map(stat => <div key={stat.label}><dt>{t(stat.label)}</dt><dd>{stat.value.toLocaleString(locale === "nl" ? "nl-NL" : "en-GB")}</dd></div>)}</dl></section>
    <section aria-labelledby="partner-manage-title"><h2 id="partner-manage-title" className="mb-3 text-sm font-semibold">{t("Make it yours")}</h2><div className="grid gap-3 xl:grid-cols-3">{[{ href: "/dashboard/rewards", label: "Rewards", description: "Shape what riders can look forward to.", icon: Gift },{ href: "/dashboard/resources", label: "Inventory", description: "Keep your voucher codes ready to go.", icon: Package },{ href: "/dashboard/staff", label: "Team", description: "Give your team the right access.", icon: Users }].map(({ href, label, description, icon: Icon }) => <Link key={href} href={href} className="partner-quicklink"><span className="rounded-xl bg-muted p-3"><Icon className="size-5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{t(label)}</h3><p>{t(description)}</p></div><ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Link>)}</div></section>
  </div></>;
}
