"use client";

import { useEffect, useRef, type ReactNode, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { usePartnerOverlay } from "@/lib/usePartnerOverlay";
import { ArrowLeft, ArrowUpRight, ChartNoAxesCombined, ClipboardList, Gift, House, LogOut, MoreHorizontal, Package, ScanLine, Settings, Users, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PartnerNotificationPreview } from "@/components/partner/PartnerNotificationPreview";
import { PartnerAppStatus } from "@/components/partner/PartnerAppStatus";
import { partnerText } from "@/lib/partnerLocale";
import type { AppSessionValue } from "@/providers/SessionProvider";
import { Button } from "@/components/ui/button";
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

export function PartnerDesktopShell({ session, children }: { session: AppSessionValue; children: ReactNode }) {
  const pathname = usePathname(), menu = useRef<HTMLDialogElement>(null);
  const router = useRouter(), overlay = usePartnerOverlay();
  const menuTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (overlay.open && !menu.current?.open) menu.current?.showModal();
    if (!overlay.open && menu.current?.open) { menu.current.close(); menuTrigger.current?.focus(); }
  }, [overlay.open]);
  const locale = session.partnerLocale ?? "en", t = (text: string) => partnerText(locale, text);
  const active = (href: string) => href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  const navigate = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    overlay.close(() => { router.push(href); if (pathname === href) window.scrollTo({ top: 0, behavior: "auto" }); });
  };
  const navigation = (mobile = false) => destinations.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} onClick={mobile ? event => navigate(event, href) : undefined} className={cn("partner-nav-link", active(href) && "is-active")}><Icon aria-hidden="true" className="size-[19px] shrink-0" /><span>{t(label)}</span></Link>);
  const parent = pathname.startsWith("/dashboard/rewards/") ? "/dashboard/rewards" : pathname.startsWith("/dashboard/collections/") ? "/dashboard/collections" : null;
  const title = pathname === "/dashboard/notifications" ? "Notifications" : destinations.find(item => active(item.href))?.label ?? "Your workspace";
  return <div className="partner-workspace" lang={locale}>
    <a href="#partner-content" className="partner-skip">{t("Skip to content")}</a>
    <aside className="partner-rail" aria-label={t("Main navigation")}>
      <Link href="/dashboard" className="partner-wordmark"><Image src="/movrr-icon-mark.png" alt="" width={34} height={34} /><span>MOVRR<span className="partner-wordmark-caption">{t("Partner Workspace")}</span></span></Link>
      <p className="partner-nav-caption">{t("Your workspace")}</p>
      <nav className="space-y-1">{navigation()}</nav>
      <div className="partner-rail-bottom"><a href={`/workspaces?lang=${locale}`} className="partner-nav-link"><ArrowUpRight aria-hidden="true" className="size-[19px]" />{t("Switch workspace")}</a><form action="/api/auth/signout" method="post"><Button variant="ghost" className="partner-nav-link w-full justify-start" type="submit"><LogOut aria-hidden="true" className="size-[19px]" />{t("Sign Out")}</Button></form></div>
    </aside>
    <div className="partner-body">
      <header className="partner-topbar">
        <div className="partner-mobile-brand">{parent ? <Button asChild variant="ghost" size="icon" aria-label={t("Back")}><Link href={parent}><ArrowLeft aria-hidden="true" /></Link></Button> : <span className="partner-brand-mark"><Image src="/movrr-icon-mark.png" alt="MOVRR" width={24} height={24} /></span>}<span>{t(title)}<span>{t("Partner Workspace")}</span></span></div>
        <span className="hidden text-sm font-medium text-muted-foreground lg:block">{t("Partner Workspace")}</span>
        <div className="flex min-w-0 items-center gap-1 sm:gap-2"><PartnerAppStatus locale={locale} /><PartnerNotificationPreview key={session.authUserId} locale={locale} /><ThemeToggle locale={locale} /></div>
      </header>
      <main key={pathname} id="partner-content" tabIndex={-1} className="partner-content">{children}</main>
      <footer className="partner-footer"><span>MOVRR</span><span>{t("Partner Workspace")}</span></footer>
    </div>
    <nav className="partner-mobile-tabs" aria-label={t("Main navigation")}>{[destinations[0], destinations[2], destinations[1], destinations[3]].map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={event => navigate(event, href)} aria-current={active(href) ? "page" : undefined} className={cn("partner-tab", active(href) && "is-active", href === "/dashboard/validate" && "partner-tab-scan")}><span><Icon aria-hidden="true" className="size-[22px]" /></span><span>{t(href === "/dashboard/validate" ? "Scan" : label)}</span></Link>)}<Button ref={menuTrigger} variant="ghost" className={cn("partner-tab", ![destinations[0], destinations[2], destinations[1], destinations[3]].some(item => active(item.href)) && "is-active")} type="button" aria-haspopup="dialog" aria-expanded={overlay.open} onClick={() => overlay.changeOpen(true)}><span><MoreHorizontal aria-hidden="true" className="size-[22px]" /></span><span>{t("More")}</span></Button></nav>
    <dialog ref={menu} className="partner-menu" aria-labelledby="partner-menu-title" onCancel={event => { event.preventDefault(); overlay.close(); }} onClick={event => { if (event.target === event.currentTarget) overlay.close(); }}><div className="partner-menu-panel"><div className="mb-5 flex items-center justify-between"><h2 id="partner-menu-title" className="text-xl font-semibold">{t("Your workspace")}</h2><Button variant="ghost" size="icon" type="button" className="partner-icon-button" aria-label={t("Close menu")} onClick={() => overlay.close()}><X aria-hidden="true" className="size-5" /></Button></div><nav className="space-y-1">{navigation(true)}</nav><a href={`/workspaces?lang=${locale}`} onClick={event => navigate(event, `/workspaces?lang=${locale}`)} className="partner-nav-link mt-4"><ArrowUpRight aria-hidden="true" className="size-5" />{t("Switch workspace")}</a><form action="/api/auth/signout" method="post"><Button variant="ghost" type="submit" className="partner-nav-link w-full justify-start"><LogOut className="size-5" aria-hidden="true" />{t("Sign Out")}</Button></form></div></dialog>
  </div>;
}
