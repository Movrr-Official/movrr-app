"use client";
import type { ReactNode } from "react";
import type { AppSessionValue } from "@/providers/SessionProvider";
import { usePartnerMobile } from "@/lib/usePartnerMobile";
import { PartnerDesktopShell } from "./PartnerDesktopShell";
import { PartnerMobileShell } from "./PartnerMobileShell";
/** Presentation only. Routes and all authorization remain server-owned. */
export function PartnerShell({ session, children }: { session: AppSessionValue; children: ReactNode }) {
  const mobile = usePartnerMobile();
  const Shell = mobile ? PartnerMobileShell : PartnerDesktopShell;
  return <Shell key={`${session.authUserId}:${session.partnerOrganisationId ?? ""}`} session={session}>{children}</Shell>;
}
