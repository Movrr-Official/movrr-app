"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";
import { getPartnerNotificationPreviewAction } from "@/app/actions/partner";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useOnline } from "@/lib/useOnline";
import { usePartnerOverlay } from "@/lib/usePartnerOverlay";
import { useRouter } from "next/navigation";
import { partnerText, type PartnerLocale } from "@/lib/partnerLocale";
import type { ProductNotification } from "@/lib/notifications";

export function PartnerNotificationPreview({ locale }: { locale: PartnerLocale }) {
  const overlay = usePartnerOverlay(), router = useRouter();
  const [items, setItems] = useState<ProductNotification[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const request = useRef(0);
  const online = useOnline(), t = (text: string) => partnerText(locale, text);
  useEffect(() => () => { request.current++; }, []);

  async function load() {
    const current = ++request.current;
    setItems([]);
    if (!online) { setStatus("error"); return; }
    setStatus("loading");
    try {
      const result = await getPartnerNotificationPreviewAction();
      if (current === request.current) { setItems(result); setStatus("ready"); }
    } catch {
      if (current === request.current) setStatus("error");
    }
  }

  function changeOpen(next: boolean) {
    overlay.changeOpen(next);
    if (next) void load();
    else { request.current++; setItems([]); setStatus("idle"); }
  }

  return <Popover open={overlay.open} onOpenChange={changeOpen}>
    <PopoverTrigger asChild><Button variant="ghost" size="icon" type="button" className="partner-icon-button" aria-label={t("Notifications")}><Bell className="size-[19px]" aria-hidden="true" /></Button></PopoverTrigger>
    <PopoverContent className="partner-popover partner-notification-preview w-96 p-0" lang={locale} aria-labelledby="partner-notification-title">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <h2 id="partner-notification-title" className="font-semibold">{t("Recent notifications")}</h2>
        <PopoverClose asChild><Button variant="ghost" size="icon" type="button" className="partner-icon-button" aria-label={t("Close notifications")}><X className="size-4" aria-hidden="true" /></Button></PopoverClose>
      </div>
      <div className="max-h-[min(60dvh,420px)] overflow-y-auto overscroll-contain" aria-busy={status === "loading" && online}>
        {!online ? <p role="status" className="p-5 text-sm text-muted-foreground">{t("Reconnect to see your notifications.")}</p>
          : status === "loading" || status === "idle" ? <p role="status" className="p-5 text-sm text-muted-foreground">{t("Loading notifications…")}</p>
          : status === "error" ? <div className="space-y-3 p-5"><p role="alert" className="text-sm">{t("Notifications are temporarily unavailable.")}</p><Button type="button" variant="outline" onClick={() => void load()}>{t("Retry")}</Button></div>
          : items.length ? <ol className="divide-y divide-border">{items.map(item => {
            const date = new Date(item.createdAt);
            return <li key={item.id} className="space-y-2 px-5 py-4">
              <div className="flex items-start justify-between gap-3"><p className="min-w-0 break-words text-sm font-semibold">{item.title}</p>{!item.isRead && <span className="shrink-0 rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">{t("Unread")}</span>}</div>
              <p className="line-clamp-3 break-words text-sm leading-relaxed text-muted-foreground">{item.message}</p>
              {!Number.isNaN(date.getTime()) && <time dateTime={item.createdAt} className="block text-xs text-muted-foreground">{new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Amsterdam" }).format(date)}</time>}
            </li>;
          })}</ol>
          : <div className="space-y-2 px-5 py-8 text-center"><CheckCheck className="mx-auto mb-3 size-6 text-muted-foreground" aria-hidden="true" /><p className="text-sm font-semibold">{t("You're all caught up")}</p><p className="text-sm text-muted-foreground">{t("New updates will appear here.")}</p></div>}
      </div>
      <div className="border-t border-border p-3"><Link href="/dashboard/notifications" onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); overlay.close(() => router.push("/dashboard/notifications")); }} className="flex min-h-11 items-center justify-center rounded-lg text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">{t("View all notifications")}</Link></div>
    </PopoverContent>
  </Popover>;
}
