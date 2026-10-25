"use client";
import { changePartnerLanguageAction } from "@/app/actions/partner";
import { partnerText, type PartnerLocale } from "@/lib/partnerLocale";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { useOnline } from "@/lib/useOnline";
import { Button } from "@/components/ui/button";
type InstallPrompt = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };
export function PartnerAppStatus({ locale = "en" }: { locale?: PartnerLocale }) {
  const languageMenu = useRef<HTMLDetailsElement>(null);
  const t = (text: string) => partnerText(locale, text), online = useOnline();
  const [install, setInstall] = useState<InstallPrompt | null>(null), [installError, setInstallError] = useState(false), [registrationError, setRegistrationError] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator && window.isSecureContext) navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => setRegistrationError(true));
    const prompt = (event: Event) => { event.preventDefault(); setInstall(event as InstallPrompt); }, installed = () => setInstall(null);
    window.addEventListener("beforeinstallprompt", prompt); window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("beforeinstallprompt", prompt); window.removeEventListener("appinstalled", installed); };
  }, []);
  return <aside className="partner-utility" aria-label={t("Workspace connection and installation")}>
    <details ref={languageMenu}><summary aria-label={t("Language")}>{locale.toUpperCase()}<ChevronDown className="size-3" aria-hidden="true" /></summary><form action={changePartnerLanguageAction} onSubmit={() => languageMenu.current?.removeAttribute("open")} className="partner-utility-popover space-y-3"><label htmlFor="partner-language" className="block font-semibold">{t("Language")}</label><select id="partner-language" name="locale" key={locale} defaultValue={locale} className="h-11 w-full rounded-lg border border-input bg-background px-3"><option value="en">English</option><option value="nl">Nederlands</option></select><Button className="min-h-11 w-full" variant="outline" type="submit">{t("Save language")}</Button></form></details>
    {install ? <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={t("Install MOVRR")} onClick={async () => { try { await install.prompt(); await install.userChoice; } catch { setInstallError(true); } finally { setInstall(null); } }}><Download className="size-[18px]" aria-hidden="true" /></Button> : <details><summary aria-label={t("Install MOVRR")}><Download className="size-[18px]" aria-hidden="true" /></summary><div className="partner-utility-popover space-y-2"><p className="font-semibold">{t("Install MOVRR")}</p><p className="leading-relaxed text-muted-foreground">{t("Use your browser Install app or Add to Home Screen option. On iPhone: Safari > Share > Add to Home Screen.")}</p></div></details>}
    {(!online || installError || registrationError) && <div className="partner-utility-message" aria-live="polite">{!online && <p role="alert">{t("You are offline. Reconnect before handing over rewards.")}</p>}{installError && <p>{t("Use your browser menu to install MOVRR.")}</p>}{registrationError && <p>{t("Offline screen unavailable.")}</p>}</div>}
  </aside>;
}
