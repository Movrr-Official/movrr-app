"use client";

import { useState } from "react";
import { PartnerSelect as Select } from "@/components/partner/PartnerSelect";
import { SubmitButton } from "@/components/form/SubmitButton";
import { partnerText, type PartnerLocale } from "@/lib/partnerLocale";

/** Presentation of permitted Partner transitions. Admin remains the approval authority. */
export function RewardEditStatus({ status, locale }: { status?: string; locale: PartnerLocale }) {
  const active = status === "active";
  const [nextStatus, setNextStatus] = useState(active ? "draft" : status ?? "draft");
  const t = (text: string) => partnerText(locale, text);
  return <div className="space-y-4 md:col-span-2">
    <label className="partner-form-label">{t("Save as")}<Select name="status" aria-label={t("Save as")} value={nextStatus} onValueChange={setNextStatus} options={["draft", "paused", "archived"].map(value => ({ value, label: t(value === "draft" ? "Draft" : value === "paused" ? "Paused" : "Archived") }))} /></label>
    <p id="reward-approval-note" className="partner-policy-note">{t(active ? "Saving changes takes this reward off sale. Save as a draft for MOVRR to review before it becomes available again." : "Only MOVRR can approve a reward for availability. Drafts, paused and archived rewards cannot be redeemed.")}</p>
    {active && <label className="partner-check-label"><input type="checkbox" name="acknowledgeWithdrawal" value="true" required aria-describedby="reward-approval-note" />{t("I understand this reward will no longer be available after saving.")}</label>}
    <SubmitButton type="submit" pendingLabel={t("Saving…")}>{t(nextStatus === "draft" ? "Save draft for review" : "Save changes")}</SubmitButton>
  </div>;
}
