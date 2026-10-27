"use client";
import type { ReactNode } from "react";
import { usePartnerMobile } from "@/lib/usePartnerMobile";

/** Select presentation only; both views receive the same server-authorized reads. */
export function PartnerPresentation({ mobile, children }: { mobile: ReactNode; children: ReactNode }) {
  return usePartnerMobile() ? mobile : children;
}
