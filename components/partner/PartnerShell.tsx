"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Bell, ChartNoAxesCombined, ClipboardList, Gift, House, LogOut, MoreHorizontal, Package, ScanLine, Settings, Users, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PartnerAppStatus } from "@/components/partner/PartnerAppStatus";
import { partnerText } from "@/lib/partnerLocale";
import type { AppSessionValue } from "@/providers/SessionProvider";
import { cn } from "@/lib/utils";

const destinations = [
  { href: "/dashboard", label: "Overview", icon: House },
  { href: "/dashboard/validate", label: "Scan a reward", icon: ScanLine },
  { href: "/dashboard/collections", label: "Collections", icon: ClipboardList },
  { href: "/dashboard/rewards", label: "Rewards", icon: Gift },
  { href: "/dashboard/resources", label: "Inventory", icon: Package },
  { href: "/dashboard/staff", label: "Team", icon: Users },
  { href: "/dashboard/analytics", label: "Activity", icon: ChartNoAxesCombined },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function PartnerShell({ session, children }: { session: AppSessionValue; children: ReactNode }) {
  const pathname = usePathname(), menu = useRef<HTMLDialogElement>(null);
  const locale = session.partnerLocale ?? "en", t = (text: string) => partnerText(locale, text);
  const active = (href: string) => href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  const navigation = (mobile = false) => destinations.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} onClick={() => mobile && menu.current?.close()} className={cn("partner-nav-link", active(href) && "is-active")}><Icon aria-hidden="true" className="size-[19px] shrink-0" /><span>{t(label)}</span></Link>);
  return <div className="partner-workspace" lang={locale}>
    <a href="#partner-content" className="partner-skip">{t("Skip to content")}</a>
    <aside className="partner-rail" aria-label={t("Main navigation")}>
      <Link href="/dashboard" className="partner-wordmark"><Image src="/movrr-icon-mark.png" alt="" width={34} height={34} /><span>MOVRR<span className="partner-wordmark-caption">{t("Partner Workspace")}</span></span></Link>
      <p className="partner-nav-caption">{t("Your workspace")}</p>
      <nav className="space-y-1">{navigation()}</nav>
      <div className="partner-rail-bottom"><a href="/workspaces" className="partner-nav-link"><ArrowUpRight aria-hidden="true" className="size-[19px]" />{t("Switch workspace")}</a><form action="/api/auth/signout" method="post"><button className="partner-nav-link w-full" type="submit"><LogOut aria-hidden="true" className="size-[19px]" />{t("Sign Out")}</button></form></div>
    </aside>
    <div className="partner-body">
      <header className="partner-topbar">
        <Link href="/dashboard" className="partner-mobile-brand"><span className="flex size-9 items-center justify-center rounded-[11px] bg-movrr-bg-primary"><Image src="/movrr-icon-mark.png" alt="" width={24} height={24} /></span><span>MOVRR<span>{t("Partner Workspace")}</span></span></Link>
        <span className="hidden text-sm font-medium text-muted-foreground lg:block">{t("Partner Workspace")}</span>
        <div className="flex min-w-0 items-center gap-1 sm:gap-2"><PartnerAppStatus locale={locale} /><Link href="/dashboard/notifications" className="partner-icon-button" aria-label={t("Notifications")} aria-current={active("/dashboard/notifications") ? "page" : undefined}><Bell className="size-[19px]" aria-hidden="true" /></Link><ThemeToggle locale={locale} /></div>
      </header>
      <main id="partner-content" tabIndex={-1} className="partner-content">{children}</main>
      <footer className="partner-footer"><span>MOVRR</span><span>{t("Partner Workspace")}</span></footer>
    </div>
    <nav className="partner-mobile-tabs" aria-label={t("Main navigation")}>{[destinations[0], destinations[2], destinations[1], destinations[3]].map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cn("partner-tab", active(href) && "is-active", href === "/dashboard/validate" && "partner-tab-scan")}><span><Icon aria-hidden="true" className="size-[22px]" /></span><span>{t(href === "/dashboard/validate" ? "Scan" : label)}</span></Link>)}<button className={cn("partner-tab", ![destinations[0], destinations[2], destinations[1], destinations[3]].some(item => active(item.href)) && "is-active")} type="button" aria-haspopup="dialog" onClick={() => menu.current?.showModal()}><span><MoreHorizontal aria-hidden="true" className="size-[22px]" /></span><span>{t("More")}</span></button></nav>
    <dialog ref={menu} className="partner-menu" aria-labelledby="partner-menu-title" onClick={event => { if (event.target === event.currentTarget) menu.current?.close(); }}><div className="partner-menu-panel"><div className="mb-5 flex items-center justify-between"><h2 id="partner-menu-title" className="text-xl font-semibold">{t("Your workspace")}</h2><button type="button" className="partner-icon-button" aria-label={t("Close menu")} onClick={() => menu.current?.close()}><X aria-hidden="true" className="size-5" /></button></div><nav className="space-y-1">{navigation(true)}</nav><a href="/workspaces" className="partner-nav-link mt-4"><ArrowUpRight aria-hidden="true" className="size-5" />{t("Switch workspace")}</a><form action="/api/auth/signout" method="post"><button type="submit" className="partner-nav-link w-full"><LogOut className="size-5" aria-hidden="true" />{t("Sign Out")}</button></form></div></dialog>
  </div>;
}
