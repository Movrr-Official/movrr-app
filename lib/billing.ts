import { BILLING_PORTAL_URL, SUPPORT_EMAIL } from "@/lib/env";

export function getBillingFallback(invoiceContact: string) {
  const connected = Boolean(BILLING_PORTAL_URL);

  return {
    connected,
    connectionState: connected ? ("handoff" as const) : ("not_connected" as const),
    planName: connected ? "External billing portal" : "Not connected",
    planStatus: connected ? "Portal handoff available" : "Awaiting provider integration",
    invoiceContact,
    usageSummary: [
      { label: "Campaign visibility", value: "Read-only" },
      { label: "Billing provider", value: connected ? "External portal" : "Not connected" },
    ],
    entitlements: ["Campaign visibility", "Analytics", "Rider participation visibility"],
    financeHandoffEmail: SUPPORT_EMAIL,
    portalUrl: BILLING_PORTAL_URL || null,
  } as const;
}
