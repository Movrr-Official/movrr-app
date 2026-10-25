"use client";
import { changePartnerLanguageAction } from "@/app/actions/partner";
import { partnerText, type PartnerLocale } from "@/lib/partnerLocale";
import { useEffect, useState } from "react";
import { useOnline } from "@/lib/useOnline";
import { Button } from "@/components/ui/button";
type InstallPrompt = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };
export function PartnerAppStatus({ locale = "en" }: { locale?: PartnerLocale }) {
  const t = (text: string) => partnerText(locale, text);
  const online = useOnline();
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [installError, setInstallError] = useState(false);
  const [registrationError, setRegistrationError] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => setRegistrationError(true));
    }
    const prompt = (event: Event) => { event.preventDefault(); setInstall(event as InstallPrompt); };
    const installed = () => setInstall(null);
    window.addEventListener("beforeinstallprompt", prompt);
    window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("beforeinstallprompt", prompt); window.removeEventListener("appinstalled", installed); };
  }, []);
  return <aside className="space-y-2 px-4 py-2 text-sm sm:px-6" aria-label={t("Workspace connection and installation")}>
    <form action={changePartnerLanguageAction} className="flex items-center gap-2">
      <label htmlFor="partner-language">{locale === "nl" ? "Taal" : "Language"}</label>
      <select id="partner-language" name="locale" key={locale} defaultValue={locale} className="rounded-md border border-input bg-background p-2"><option value="en">English</option><option value="nl">Nederlands</option></select>
      <Button size="sm" variant="outline" type="submit">{t("Save")}</Button>
    </form>
    {!online && <p role="alert">{t("You are offline. Reconnect before handing over rewards.")}</p>}
    {installError && <p role="status">{t("Use your browser menu to install MOVRR.")}</p>}
    {registrationError && <p role="status">{t("Offline screen unavailable.")}</p>}
    {install ? <Button variant="outline" size="sm" onClick={async () => {
      try { await install.prompt(); await install.userChoice; } catch { setInstallError(true); } finally { setInstall(null); }
    }}>{t("Install MOVRR")}</Button> : <details><summary className="cursor-pointer">{t("Install MOVRR")}</summary><p className="pt-2 text-muted-foreground">{t("Use your browser Install app or Add to Home Screen option. On iPhone: Safari > Share > Add to Home Screen.")}</p></details>}
  </aside>;
}
