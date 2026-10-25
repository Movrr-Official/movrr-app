"use client";
import { changePartnerLanguageAction } from "@/app/actions/partner";
import { partnerText, type PartnerLocale } from "@/lib/partnerLocale";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Download } from "lucide-react";
import { useOnline } from "@/lib/useOnline";
import { usePartnerOverlay } from "@/lib/usePartnerOverlay";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { SubmitButton } from "@/components/form/SubmitButton";
import { Button } from "@/components/ui/button";
type InstallPrompt = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };
export function PartnerAppStatus({ locale = "en" }: { locale?: PartnerLocale }) {
  const language = usePartnerOverlay(), installation = usePartnerOverlay();
  const [languageError, setLanguageError] = useState(false);
  const t = (text: string) => partnerText(locale, text), online = useOnline();
  const [install, setInstall] = useState<InstallPrompt | null>(null), [installError, setInstallError] = useState(false), [registrationError, setRegistrationError] = useState(false);
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator && window.isSecureContext) navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => setRegistrationError(true));
    const display = window.matchMedia("(display-mode: standalone)");
    const syncDisplay = () => setStandalone(display.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    syncDisplay(); display.addEventListener("change", syncDisplay);
    const prompt = (event: Event) => { event.preventDefault(); setInstall(event as InstallPrompt); }, installed = () => { setInstall(null); setStandalone(true); };
    window.addEventListener("beforeinstallprompt", prompt); window.addEventListener("appinstalled", installed);
    const viewport = window.visualViewport;
    let restingHeight = window.innerHeight, restingWidth = window.innerWidth;
    const keyboard = () => {
      const editing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "");
      if (!editing || restingWidth !== window.innerWidth) { restingHeight = window.innerHeight; restingWidth = window.innerWidth; }
      document.body.toggleAttribute("data-partner-keyboard", editing && !!viewport && viewport.height < restingHeight * .78);
    };
    viewport?.addEventListener("resize", keyboard); document.addEventListener("focusin", keyboard); document.addEventListener("focusout", keyboard);
    return () => { display.removeEventListener("change", syncDisplay); window.removeEventListener("beforeinstallprompt", prompt); window.removeEventListener("appinstalled", installed); viewport?.removeEventListener("resize", keyboard); document.removeEventListener("focusin", keyboard); document.removeEventListener("focusout", keyboard); document.body.removeAttribute("data-partner-keyboard"); };
  }, []);
  useEffect(() => {
    // Public presentation preferences only. No identity, session or merchant state.
    try { localStorage.setItem("movrr-partner-language", locale); } catch { /* Storage may be disabled. */ }
  }, [locale]);
  return <aside className="partner-utility" aria-label={t("Workspace connection and installation")}>
    <Popover open={language.open} onOpenChange={language.changeOpen}>
      <PopoverTrigger asChild><Button variant="ghost" size="icon" type="button" className="partner-icon-button" aria-label={`${t("Language")}: ${locale === "nl" ? "Nederlands" : "English"}`}><Image src={locale === "nl" ? "/flags/nl.svg" : "/flags/gb.svg"} alt="" width={24} height={18} /></Button></PopoverTrigger>
      <PopoverContent className="partner-popover w-60 p-2" lang={locale} aria-labelledby="partner-language-title">
        <p id="partner-language-title" className="sr-only">{t("Language")}</p>
        <form action={async form => { setLanguageError(false); try { await changePartnerLanguageAction(form); language.close(); } catch { setLanguageError(true); } }} className="space-y-1">
          {[{ value: "en", label: "English", flag: "gb" }, { value: "nl", label: "Nederlands", flag: "nl" }].map(option => <SubmitButton key={option.value} name="locale" value={option.value} variant="ghost" type="submit" disabled={!online} aria-current={locale === option.value ? "true" : undefined} className="min-h-11 w-full justify-start gap-3 px-3" pendingLabel={t("Saving…")}><Image src={`/flags/${option.flag}.svg`} alt="" width={24} height={18} /><span>{option.label}</span>{locale === option.value && <Check className="ml-auto size-4" aria-hidden="true" />}</SubmitButton>)}
          {languageError && <p role="alert" className="px-3 py-2 text-sm">{t("Language could not be saved. Please try again.")}</p>}
        </form>
      </PopoverContent>
    </Popover>
    {!standalone && (install ? <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={t("Install MOVRR")} onClick={async () => { try { await install.prompt(); await install.userChoice; } catch { setInstallError(true); } finally { setInstall(null); } }}><Download className="size-[18px]" aria-hidden="true" /></Button> : <Popover open={installation.open} onOpenChange={installation.changeOpen}><PopoverTrigger asChild><Button variant="ghost" size="icon" type="button" className="partner-icon-button" aria-label={t("Install MOVRR")}><Download className="size-[18px]" aria-hidden="true" /></Button></PopoverTrigger><PopoverContent className="partner-popover space-y-2" lang={locale} aria-labelledby="partner-install-title"><p id="partner-install-title" className="font-semibold">{t("Install MOVRR")}</p><p className="text-sm leading-relaxed text-muted-foreground">{t("Use your browser Install app or Add to Home Screen option. On iPhone: Safari > Share > Add to Home Screen.")}</p></PopoverContent></Popover>)}
    {(!online || installError || registrationError) && <div className="partner-utility-message" aria-live="polite">{!online && <p role="alert">{t("You are offline. Reconnect before handing over rewards.")}</p>}{installError && <p>{t("Use your browser menu to install MOVRR.")}</p>}{registrationError && <p>{t("Offline screen unavailable.")}</p>}</div>}
  </aside>;
}
