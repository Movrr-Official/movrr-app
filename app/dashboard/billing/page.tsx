import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/stats/StatsCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProductSession } from "@/lib/appUser";
import { getAdvertiserDashboardData } from "@/services/advertiser";
import {
  billingConnectionLabel,
  type BillingConnectionState,
} from "@/lib/platform/capabilityRegistry.types";
import { redirect } from "next/navigation";
import {
  CircleDollarSign,
  CreditCard,
  FileText,
  ShieldCheck,
} from "lucide-react";

export default async function DashboardBillingPage() {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "advertiser") redirect("/dashboard");

  const dashboard = await getAdvertiserDashboardData();
  const billing = dashboard.billing;
  const connectionState = billing.connectionState as BillingConnectionState;
  const connectionLabel = billingConnectionLabel(connectionState);

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Billing"
          description="Advertiser billing connection and entitlement posture."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
          <StatsCard
            title="Connection state"
            value={connectionLabel}
            description="Canonical billing connection vocabulary"
            icon={ShieldCheck}
          />
          <StatsCard
            title="Plan"
            value={billing.planName}
            description={billing.planStatus}
            icon={CircleDollarSign}
          />
          <StatsCard
            title="Invoice contact"
            value={billing.invoiceContact}
            description="Current billing contact used for invoicing"
            icon={FileText}
          />
          <StatsCard
            title="Entitlements"
            value={billing.entitlements.length}
            description="Visible billing and product entitlements"
            icon={CreditCard}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Usage summary</CardTitle>
              <CardDescription>
                Read-only usage and entitlement posture for this advertiser
                workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {billing.usageSummary.length ? (
                billing.usageSummary.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 p-4"
                  >
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.value}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No billing usage data yet"
                  description="Usage and entitlement summaries will appear here when the advertiser billing runtime is connected."
                  iconName="file"
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Billing handoff</CardTitle>
              <CardDescription>
                Portal access or finance support handoff for billing questions
                and invoice requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                {billing.connected
                  ? `Billing connection state: ${connectionLabel}. Use the portal link below for invoice and subscription access.`
                  : `Billing connection state: ${connectionLabel}. Use the finance handoff contact below for invoice and plan support.`}
              </div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <p className="text-sm text-muted-foreground">Finance handoff</p>
                <p className="mt-2 font-medium">
                  {billing.financeHandoffEmail}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <p className="font-medium">Entitlements</p>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {billing.entitlements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              {billing.portalUrl ? (
                <Link
                  href={billing.portalUrl}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Open billing portal
                </Link>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
