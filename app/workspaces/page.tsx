import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAccountWorkspaces } from "@/lib/platform/workspaces";
import { getAuthenticatedAppUser } from "@/lib/appUser";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/form/SubmitButton";
import { partnerText, type PartnerLocale } from "@/lib/partnerLocale";
import { ArrowRight, Bike, Building2, Check, Landmark, Megaphone, Store } from "lucide-react";

export default async function WorkspacesPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> } = {}) {
  const account = await getAuthenticatedAppUser();
  if (!account) redirect("/auth/signin?redirectTo=/workspaces");
  const workspaces = await getAccountWorkspaces();
  const cookieStore = await cookies();
  let locale: PartnerLocale = account.appUser.languagePreference === "nl-NL" ? "nl" : "en";
  try {
    const saved = JSON.parse(cookieStore.get("movrr-partner-locale")?.value ?? "null");
    if (saved?.actor === account.authUser.id && (saved.locale === "en" || saved.locale === "nl")) locale = saved.locale;
  } catch { /* A presentation preference cannot change workspace access. */ }
  const requestedLanguage = (await searchParams)?.lang;
  if (requestedLanguage === "en" || requestedLanguage === "nl") locale = requestedLanguage;
  const t = (text: string) => partnerText(locale, text);
  const total = workspaces.memberships.length + Number(workspaces.rider);
  const selected = cookieStore.get("movrr-workspace")?.value
    ?? (total === 1 ? workspaces.memberships[0]?.organisationId ?? "rider" : undefined);
  const choices = [
    ...(workspaces.rider ? [{ key: "rider", name: t("Rider"), type: t("Personal workspace"), role: "", icon: Bike }] : []),
    ...workspaces.memberships.map(member => ({
      key: member.organisationId, name: member.name,
      type: t(member.domain === "partner" ? "Partner Workspace" : member.domain === "advertiser" ? "Advertiser workspace" : "Government workspace"),
      role: t(member.role === "partner_operations_manager" ? "Operations manager" : member.role.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")),
      icon: member.domain === "partner" ? Store : member.domain === "advertiser" ? Megaphone : Landmark,
    })),
  ];
  async function select(form: FormData) {
    "use server";
    const requested = String(form.get("workspace") ?? "");
    const current = await getAccountWorkspaces();
    if (!(requested === "rider" && current.rider) && !current.memberships.some(member => member.organisationId === requested)) throw new Error("Active workspace membership required");
    (await cookies()).set("movrr-workspace", requested, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
    redirect("/dashboard");
  }
  return <main className="workspace-picker" lang={locale}>
    <header className="workspace-picker-header"><a href="/workspaces" aria-label="MOVRR" className="flex min-h-11 items-center gap-2.5 text-xl font-extrabold tracking-tight"><span className="flex size-9 items-center justify-center rounded-[11px] bg-movrr-bg-primary"><Image src="/movrr-icon-mark.png" alt="" width={24} height={24} /></span>MOVRR</a><form action="/api/auth/signout" method="post"><Button variant="ghost" className="min-h-11">{t("Sign out")}</Button></form></header>
    <section className="workspace-picker-content" aria-labelledby="workspace-heading">
      <div className="mb-8 space-y-3"><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">{t("Your MOVRR account")}</p><h1 id="workspace-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">{t(total ? "Choose your workspace" : "Welcome to MOVRR")}</h1><p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">{t(total ? "Choose where you want to work. Each workspace keeps its own tools and access." : "Your account is ready. If you received an invitation, follow its link to join your organisation.")}</p></div>
      <div className="workspace-choice-list">
        {choices.map(choice => {
          const active = choice.key === selected, Icon = choice.icon;
          return <form action={select} key={choice.key}>
            <input type="hidden" name="workspace" value={choice.key} />
            <SubmitButton variant="outline" className="workspace-choice" pendingLabel={t("Opening workspace?")} aria-label={`${t("Open workspace")}: ${choice.name}`}>
              <span className="workspace-choice-icon"><Icon className="size-6" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1 text-left"><span className="block text-xs font-medium text-muted-foreground">{choice.type}</span><span className="mt-1 block break-words text-base font-semibold sm:text-lg">{choice.name}</span>{choice.role && <span className="mt-1 block text-xs text-muted-foreground">{choice.role}</span>}{active && <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary"><Check className="size-3.5" aria-hidden="true" />{t("Current workspace")}</span>}</span>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </SubmitButton>
          </form>;
        })}
        {!total && <div className="rounded-2xl border border-border bg-background p-6"><Building2 className="mb-4 size-6 text-muted-foreground" aria-hidden="true" /><h2 className="font-semibold">{t("Your access will appear here")}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("Contact your organisation if you need an invitation or help with access.")}</p></div>}
      </div>
      <div className="mt-8 min-w-0 border-t border-border pt-5 text-sm"><p className="font-medium">{account.appUser.name}</p><p className="mt-1 break-all text-xs text-muted-foreground">{account.appUser.email}</p></div>
    </section>
    <footer className="workspace-picker-footer"><span>MOVRR</span><span>{t("Your workspace. Your next move.")}</span></footer>
  </main>;
}
