"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Gift, Plus, Search, X } from "lucide-react";
import type { PartnerReward } from "@/schemas";
import { partnerText, type PartnerLocale } from "@/lib/partnerLocale";
import { partnerLabel } from "@/lib/partnerPresentation";
import { PartnerCatalogImage } from "./InventoryThumbnail";

export function PartnerMobileRewards({ rewards, canManage, error, locale }: { rewards: PartnerReward[]; canManage: boolean; error: string | null; locale: PartnerLocale }) {
  const [search, setSearch] = useState("");
  const t = (text: string) => partnerText(locale, text);
  const matches = rewards.filter(reward => `${reward.name ?? ""} ${reward.description ?? ""}`.toLocaleLowerCase(locale).includes(search.trim().toLocaleLowerCase(locale)));
  const number = (value: number) => value.toLocaleString(locale === "nl" ? "nl-NL" : "en-GB");
  return <div className="partner-desk-screen partner-catalog-screen">
    <div className="partner-screen-title partner-title-with-action"><div><p>{t("Your offering")}</p><h1>{t("Rewards")}</h1></div>{canManage && rewards.length > 0 && <Link href="/dashboard/rewards/create" className="partner-square-action" aria-label={t("Add reward")}><Plus size={22} aria-hidden="true" /></Link>}</div>
    {!error && rewards.length > 0 && <label className="partner-catalog-search"><Search size={18} aria-hidden="true" /><span className="sr-only">{t("Search rewards")}</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={t("Search rewards")} autoComplete="off" />{search && <button type="button" onClick={() => setSearch("")} aria-label={t("Clear search")}><X size={18} aria-hidden="true" /></button>}</label>}
    {error ? <div className="partner-desk-empty" role="alert"><p>{t(error)}</p><a href="/dashboard/rewards">{t("Retry")}<ArrowRight size={16} aria-hidden="true" /></a></div> : !rewards.length ? <div className="partner-desk-empty"><Gift size={32} aria-hidden="true" /><h2>{t("Build your reward catalog")}</h2><p>{t("Create a draft, add your voucher codes, and prepare it with MOVRR.")}</p>{canManage && <Link href="/dashboard/rewards/create">{t("Create your first reward")}<ArrowRight size={16} aria-hidden="true" /></Link>}</div> : <>
      <div className="partner-list-caption"><span>{t("Catalog")}</span><span role="status" aria-live="polite">{number(matches.length)} {t("rewards")}</span></div>
      {matches.length ? <ul className="partner-catalog-list">{matches.map(reward => <li key={reward.id}><article className="partner-catalog-item"><div className="partner-catalog-image"><PartnerCatalogImage src={reward.thumbnailUrl} /></div><div className="partner-catalog-copy"><div className="partner-catalog-state">{reward.status && <span>{partnerLabel(reward.status, locale)}</span>}{reward.stockAvailable === 0 && <span>{t("Out of stock")}</span>}</div><h2>{reward.name ?? t("Reward")}{canManage && <ChevronRight size={16} aria-hidden="true" />}</h2>{reward.description && <p>{reward.description}</p>}<dl><div><dt>{t("Points cost")}</dt><dd>{reward.pointsCost === 0 ? t("Free") : reward.pointsCost != null ? number(reward.pointsCost) : t("Unavailable")}</dd></div>{reward.stockAvailable != null && <div><dt>{t("Stock")}</dt><dd>{number(reward.stockAvailable)}</dd></div>}</dl></div>{canManage && <Link href={`/dashboard/rewards/${reward.id}/edit`} className="partner-catalog-open" aria-label={`${t("Manage")}: ${reward.name ?? t("Reward")}`} />}</article></li>)}</ul> : <div className="partner-desk-empty"><Search size={28} aria-hidden="true" /><h2>{t("No matching rewards")}</h2><p>{t("Try another name or clear your search.")}</p><button type="button" onClick={() => setSearch("")}>{t("Clear search")}</button></div>}
    </>}
  </div>;
}
