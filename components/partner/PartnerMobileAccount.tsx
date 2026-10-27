import Link from "next/link";
import { ArrowUpRight, Bell, ChartNoAxesCombined, ChevronRight, LogOut, Package, Settings, Users } from "lucide-react";
import { partnerText, type PartnerLocale } from "@/lib/partnerLocale";
import { PartnerMobilePreferences } from "./PartnerMobilePreferences";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

const icons = { Inventory: Package, Team: Users, Performance: ChartNoAxesCombined, Settings, Notifications: Bell };
export function PartnerMobileAccount({ name, email, links, locale }: { name: string; email: string; links: { href: string; label: string }[]; locale: PartnerLocale }) {
  const t = (text: string) => partnerText(locale, text);
  return <div className="partner-account-screen partner-desk-screen">
    <div className="partner-screen-title"><p>{t("Workspace and preferences")}</p><h1>{t("Account")}</h1></div>
    <section className="partner-account-person" aria-label={t("Your account")}><span aria-hidden="true">{name.slice(0, 1).toLocaleUpperCase(locale)}</span><div><h2>{name}</h2><p>{email}</p></div></section>
    <section><div className="partner-section-label"><h2>{t("Workspace management")}</h2></div><nav className="partner-settings-rows" aria-label={t("Your workspace")}>{links.map(({ href, label }) => {
      const Icon = icons[label as keyof typeof icons] ?? Settings;
      return <Link href={href} key={href}><Icon size={20} aria-hidden="true" /><span>{t(label)}</span><ChevronRight size={16} aria-hidden="true" /></Link>;
    })}<a href={`/workspaces?lang=${locale}`}><ArrowUpRight size={20} aria-hidden="true" /><span>{t("Switch workspace")}</span><ChevronRight size={16} aria-hidden="true" /></a></nav></section>
    <section><div className="partner-section-label"><h2>{t("App preferences")}</h2></div><div className="partner-settings-rows"><PartnerMobilePreferences locale={locale} /><div className="partner-settings-theme"><span>{t("Appearance")}</span><ThemeToggle locale={locale} /></div></div></section>
    <form action="/api/auth/signout" method="post"><Button variant="ghost" type="submit" className="partner-desk-signout"><LogOut size={18} aria-hidden="true" />{t("Sign Out")}</Button></form>
    <p className="partner-account-footer">MOVRR Partner</p>
  </div>;
}
