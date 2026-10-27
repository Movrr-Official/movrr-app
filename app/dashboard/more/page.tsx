import { PartnerPresentation } from "@/components/partner/PartnerPresentation";
import { PartnerMobileAccount } from "@/components/partner/PartnerMobileAccount";
import Link from "next/link";
import { PartnerMobilePreferences } from "@/components/partner/PartnerMobilePreferences";
import { ArrowRight, ArrowUpRight, Bell, ChartNoAxesCombined, LogOut, Package, Settings, Users } from "lucide-react";
import { requirePartnerSession } from "@/lib/appUser";
import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export default async function PartnerAccountPage() {
  const session = await requirePartnerSession(), locale = await getPartnerLocale();
  const t = (text: string) => partnerText(locale, text), capabilities = session.partnerContext!.capabilities;
  const links = [
    { href: "/dashboard/resources", label: "Inventory", icon: Package, permitted: capabilities.includes("resources.manage") },
    { href: "/dashboard/staff", label: "Team", icon: Users, permitted: capabilities.includes("staff.manage") },
    { href: "/dashboard/analytics", label: "Performance", icon: ChartNoAxesCombined, permitted: capabilities.includes("analytics.view") },
    { href: "/dashboard/settings", label: "Settings", icon: Settings, permitted: true },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell, permitted: true },
  ];
  return <PartnerPresentation mobile={<PartnerMobileAccount name={session.appUser.name} email={session.appUser.email} links={links.filter(link => link.permitted).map(({href, label}) => ({href, label}))} locale={locale} />}><div className="partner-account-screen"><div className="partner-app-intro"><p>MOVRR Partner</p><h1>{t("Your account")}</h1></div>
    <section className="partner-account-identity"><span className="partner-account-avatar" aria-hidden="true">{session.appUser.name.slice(0, 1).toLocaleUpperCase(locale)}</span><div><h2>{session.appUser.name}</h2><p>{session.appUser.email}</p></div></section>
    <nav className="partner-app-list" aria-label={t("Your workspace")}>{links.filter(link => link.permitted).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="partner-app-list-row"><Icon aria-hidden="true" /><strong>{t(label)}</strong><ArrowRight size={18} aria-hidden="true" /></Link>)}</nav>
    <div className="partner-app-list"><PartnerMobilePreferences locale={locale} /><div className="partner-app-list-row"><span className="flex-1">{t("Appearance")}</span><ThemeToggle locale={locale} /></div><a href={`/workspaces?lang=${locale}`} className="partner-app-list-row"><ArrowUpRight aria-hidden="true" /><strong>{t("Switch workspace")}</strong><ArrowRight size={18} aria-hidden="true" /></a><form action="/api/auth/signout" method="post"><Button variant="ghost" type="submit" className="partner-app-signout"><LogOut size={22} aria-hidden="true" />{t("Sign Out")}</Button></form></div>
  </div></PartnerPresentation>;
}
