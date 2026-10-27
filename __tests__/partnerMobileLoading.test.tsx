import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ mobile: true, role: "partner", locale: "en" }));
vi.mock("@/lib/usePartnerMobile", () => ({ usePartnerMobile: () => state.mobile }));
vi.mock("@/providers/SessionProvider", () => ({ useAppSession: () => ({ role: state.role, partnerLocale: state.locale }) }));
import { PartnerMobileLoading, type PartnerLoadingScreen } from "@/components/partner/PartnerMobileLoading";
import { PartnerLoadingBoundary } from "@/components/partner/PartnerLoadingBoundary";
import Home from "@/app/dashboard/loading";
import Activity from "@/app/dashboard/collections/loading";
import Scan from "@/app/dashboard/validate/loading";
import Rewards from "@/app/dashboard/rewards/loading";
import Account from "@/app/dashboard/more/loading";
import Inventory from "@/app/dashboard/resources/loading";
import Team from "@/app/dashboard/staff/loading";
import Settings from "@/app/dashboard/settings/loading";
import Performance from "@/app/dashboard/analytics/loading";
import Notifications from "@/app/dashboard/notifications/loading";
import Collection from "@/app/dashboard/collections/[id]/loading";
import Create from "@/app/dashboard/rewards/create/loading";
import Edit from "@/app/dashboard/rewards/[id]/edit/loading";
const routes = [[Home,"home"],[Activity,"activity"],[Scan,"scan"],[Rewards,"rewards"],[Account,"account"],[Inventory,"inventory"],[Team,"team"],[Settings,"settings"],[Performance,"performance"],[Notifications,"notifications"],[Collection,"collection"],[Create,"reward-create"],[Edit,"reward-edit"]] as const;

it("gives every Partner boundary its own bounded, decorative and localized retrieval composition", () => {
  state.mobile=true;state.role="partner";
  for(const locale of ["en","nl"]) for(const [Loading,screen] of routes) {
    state.locale=locale;
    const html=renderToStaticMarkup(<Loading />);
    expect(html).toContain(`data-loading-screen="${screen}"`);
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html).toContain('aria-live="polite"');expect(html).toContain('aria-busy="true"');
    expect(html).toContain('class="partner-loading-body" aria-hidden="true"');
    expect(html).not.toMatch(/<(input|button|form|a|video)\b/);
    expect((html.match(/data-slot="skeleton"/g)||[]).length).toBeLessThan(70);
    if(locale==="nl") expect(html.match(/class="sr-only">([^<]+)/)?.[1]).toMatch(/laden|voorbereiden/);
  }
});
it("matches the requested content rather than a generic dashboard or invented KPIs", () => {
  const html=(screen:PartnerLoadingScreen)=>renderToStaticMarkup(<PartnerMobileLoading screen={screen} locale="en"/>);
  expect(html("scan")).toContain('data-loading-part="camera"');
  expect(html("rewards")).toContain('data-loading-part="catalog"');
  expect(html("rewards")).toContain('data-loading-part="search"');
  expect(html("reward-edit")).toContain('data-loading-part="fields"');
  expect(html("settings")).toContain('data-loading-part="details"');
  expect(html("settings")).not.toContain('data-loading-part="fields"');
  expect(html("performance")).not.toContain('data-loading-part="metrics"');
  expect(html("activity")).not.toMatch(/Ready for handover|Completed|No collection history/);
  expect(html("collection")).not.toMatch(/Confirm collection|Collection complete/);
});
it("retains the exact supplied fallback for desktop and other product roles", () => {
  const fallback=<div data-existing="fallback">Existing desktop loading</div>;
  for(const [role,mobile] of [["partner",false],["rider",true],["advertiser",true],["government",true]] as const) {
    state.role=role;state.mobile=mobile;
    expect(renderToStaticMarkup(<PartnerLoadingBoundary screen="rewards">{fallback}</PartnerLoadingBoundary>)).toBe(renderToStaticMarkup(fallback));
  }
});
