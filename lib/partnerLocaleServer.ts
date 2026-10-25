import { cookies } from "next/headers";
import { requirePartnerSession } from "@/lib/appUser";
import type { PartnerLocale } from "@/lib/partnerLocale";

export async function getPartnerLocale(): Promise<PartnerLocale> {
  const session = await requirePartnerSession();
  try {
    const saved = JSON.parse((await cookies()).get("movrr-partner-locale")?.value ?? "null");
    if (saved?.actor === session.authUser.id && (saved.locale === "en" || saved.locale === "nl")) return saved.locale;
  } catch { /* Presentation preference never changes account authorization. */ }
  return session.appUser?.languagePreference === "nl-NL" ? "nl" : "en";
}
