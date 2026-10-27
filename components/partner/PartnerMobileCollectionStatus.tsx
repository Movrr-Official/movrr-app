"use client";
import Link from "next/link";
import { Check, ScanLine, ShieldCheck } from "lucide-react";
import { usePartnerMobile } from "@/lib/usePartnerMobile";
import { partnerLabel } from "@/lib/partnerPresentation";

/** Read-only presentation of the recorded state. Never advances a collection. */
export function PartnerMobileCollectionStatus({ state, locale }: { state?: string; locale: "en" | "nl" }) {
  const mobile = usePartnerMobile();
  if (!mobile) return null;
  const complete = ["completed","collected","delivered","dispatched"].includes(state ?? "");
  const Icon = complete ? Check : state === "validated" ? ShieldCheck : ScanLine;
  return <div className="partner-collection-mobile-status" data-state={state}>
    <div><span><Icon size={22} aria-hidden="true" /></span><p>{partnerLabel(state,locale)}</p></div>
    {complete && <Link href="/dashboard/collections">{locale === "nl" ? "Terug naar activiteit" : "Back to activity"}</Link>}
  </div>;
}

export function PartnerMobileSecondaryAction({ children, locale }: { children: React.ReactNode; locale: "en" | "nl" }) {
  const mobile = usePartnerMobile();
  return mobile ? <details className="partner-collection-secondary"><summary>{locale === "nl" ? "Beloning annuleren" : "Cancel reward"}</summary>{children}</details> : children;
}
