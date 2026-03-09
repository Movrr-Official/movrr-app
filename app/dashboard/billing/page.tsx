import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProductSession } from "@/lib/appUser";
import { getAdvertiserDashboardData } from "@/services/advertiser";
import { redirect } from "next/navigation";

export default async function DashboardBillingPage() {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "advertiser") redirect("/dashboard");

  const dashboard = await getAdvertiserDashboardData();
  const billing = dashboard.billing;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Read-only billing posture for the authenticated advertiser workspace. Finance handoff is used until a live provider contract is connected."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Connection state" value={billing.connectionState.replace(/_/g, " ")} detail="Current billing runtime connectivity status" iconName="dashboard" />
        <StatCard title="Plan" value={billing.planName} detail={billing.planStatus} iconName="budget" />
        <StatCard title="Invoice contact" value={billing.invoiceContact} detail="Current billing contact used for invoicing" iconName="file" />
        <StatCard title="Entitlements" value={billing.entitlements.length} detail="Visible billing and product entitlements" iconName="users" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="glass-card border-border/60">
          <CardHeader>
            <CardTitle>Usage summary</CardTitle>
            <CardDescription>Read-only usage and entitlement posture for this advertiser workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {billing.usageSummary.length ? (
              billing.usageSummary.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 p-4">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.value}</p>
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

        <Card className="glass-card border-border/60">
          <CardHeader>
            <CardTitle>Billing handoff</CardTitle>
            <CardDescription>Portal access or finance support handoff for billing questions and invoice requests.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
              {billing.connected
                ? "Billing is connected for this advertiser workspace. Use the portal link below for invoice and subscription access."
                : "Billing provider integration is not yet connected. Use the finance handoff contact below for invoice and plan support."}
            </div>
            <div className="rounded-xl border border-border/60 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Finance handoff</p>
              <p className="mt-2 font-medium">{billing.financeHandoffEmail}</p>
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
              <Link href={billing.portalUrl} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                Open billing portal
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
