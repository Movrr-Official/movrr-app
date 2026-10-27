"use client";
import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowLeft, ClipboardList, Gift, House, ScanLine, UserRound } from "lucide-react";
import { PartnerAppStatus } from "./PartnerAppStatus";
import { PartnerNotificationPreview } from "./PartnerNotificationPreview";
import { partnerText } from "@/lib/partnerLocale";
import { partnerMobileParent, partnerMobileTab, partnerMobileTabs } from "@/lib/partnerMobileNavigation";
import type { AppSessionValue } from "@/providers/SessionProvider";
const icons = [House, ClipboardList, ScanLine, Gift, UserRound];
export function PartnerMobileShell({ session, children }: { session: AppSessionValue; children: ReactNode }) {
  const pathname = usePathname(), active = partnerMobileTab(pathname), parent = partnerMobileParent(pathname);
  const content = useRef<HTMLElement>(null), previous = useRef(pathname);
  const shell = useRef<HTMLDivElement>(null);
  const locale = session.partnerLocale ?? "en", t = (text: string) => partnerText(locale, text);
  const titles: Record<string, string> = { "/dashboard/resources": "Inventory", "/dashboard/staff": "Team", "/dashboard/settings": "Settings", "/dashboard/analytics": "Performance", "/dashboard/notifications": "Notifications" };
  const title = parent ? (titles[pathname] ?? (pathname.includes("/rewards/") ? "Rewards" : "Reward collection")) : partnerMobileTabs.find(tab => tab.href === active)?.label ?? "Home";
  useEffect(() => {
    if (previous.current !== pathname) { previous.current = pathname; content.current?.focus({ preventScroll: true }); }
  }, [pathname]);
  useEffect(() => {
    // Match installed browser chrome to the app surface without changing the web viewport.
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta || !shell.current) return;
    const original = meta.content;
    const sync = () => {
      const current = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (!current || !shell.current) return;
      const surface = getComputedStyle(shell.current).getPropertyValue("--background").trim();
      if (current.content !== surface) current.content = surface;
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    observer.observe(shell.current, { attributes: true, attributeFilter: ["data-screen"] });
    // Next can replace viewport metadata during client navigation.
    observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["content"] });
    return () => { observer.disconnect(); const current = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]'); if (current) current.content = original; };
  }, []);
  return <div ref={shell} className="partner-workspace partner-mobile-app" lang={locale} data-presentation="mobile" data-screen={active.split("/").at(-1) ?? "home"}>
    <a href="#partner-content" className="partner-skip">{t("Skip to content")}</a>
    <header className="partner-app-header">
      <div className="partner-app-heading">{parent ? <><Link href={parent} className="partner-app-back" aria-label={t("Back")}><ArrowLeft aria-hidden="true" /></Link><p>{t(title)}</p></> : <Link href="/dashboard/more" className="partner-app-wordmark" aria-label={t("Your account")}><Image src="/pwa/partner/icon-192.png" width={36} height={36} alt="" /><span>MOVRR Partner</span></Link>}</div>
      <div className="partner-app-tools"><PartnerAppStatus locale={locale} presentation="mobile-status" /><PartnerNotificationPreview key={session.authUserId} locale={locale} /></div>
    </header>
    <main ref={content} id="partner-content" tabIndex={-1} className="partner-content partner-app-content">{children}</main>
    <nav className="partner-mobile-tabs partner-app-tabs" aria-label={t("Main navigation")}>
      {partnerMobileTabs.map(({ href, label }, index) => { const Icon = icons[index]; return <Link key={href} href={href} aria-current={href === active ? "page" : undefined} className={`partner-tab ${href === active ? "is-active" : ""} ${index === 2 ? "partner-tab-scan" : ""}`} onClick={() => { if (pathname === href) window.scrollTo({ top: 0, behavior: "auto" }); }}><span><Icon aria-hidden="true" size={22} /></span><span>{t(label)}</span></Link>; })}
    </nav>
  </div>;
}
