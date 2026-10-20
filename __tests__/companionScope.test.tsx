import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/layout/Sidebar";
import { resolveActiveNavigationHref } from "@/components/layout/sidebarNavigation";
const state = vi.hoisted(() => ({ guard: vi.fn(), rewards: vi.fn(), orders: vi.fn(), feature: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/appUser", () => ({ getCurrentProductSession: state.guard, requireProductSession: state.guard }));
vi.mock("@/services/rider", () => ({ getRiderRewardsData: state.rewards }));
vi.mock("@/services/partner", () => ({ listPartnerRewards: vi.fn() }));
vi.mock("@/lib/platform/riderPlatform", () => ({ listRedemptions: state.orders }));
vi.mock("@/lib/platform/riderSelfService", () => ({ readRiderFeature: state.feature }));
vi.mock("@/components/rider/EarnedAchievements", () => ({ EarnedAchievements: () => <p>Earned achievements</p> }));
vi.mock("@/app/actions/riderSelfService", () => ({ riderSelfServiceAction: vi.fn() }));
vi.mock("@/app/actions/privacy", () => ({ requestAccountDeletion: vi.fn() }));
import RewardsPage from "@/app/dashboard/rewards/page";
import SelfServicePage from "@/app/dashboard/settings/self-service/page";
import PrivacyPage from "@/app/dashboard/settings/privacy/page";
const destinations = ["/dashboard", "/dashboard/campaigns", "/dashboard/routes", "/dashboard/rides", "/dashboard/rewards", "/dashboard/notifications", "/dashboard/settings"];
beforeEach(() => {
  vi.clearAllMocks();
  state.guard.mockResolvedValue({ appUser: { id: "account", role: "rider" } });
  state.feature.mockResolvedValue([]);
  state.orders.mockResolvedValue([{ id: "order", rewardTitle: "Existing reward", redemptionStatus: "completed", pointsSpent: 30, isFree: false }]);
  state.rewards.mockResolvedValue({ rewards: [], rewardsSummary: { availablePoints: 70, lifetimePointsEarned: 100, awardedPoints: 100, redeemedPoints: 30, adjustmentPoints: 0 } });
});
it("keeps exactly seven rider destinations and marks nested account/reward pages correctly", () => {
  const html = renderToStaticMarkup(<Sidebar role="rider" pathname="/dashboard/settings/privacy" sidebarOpen onToggle={() => {}} onCloseMobile={() => {}} />);
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1]).filter(href => href.startsWith("/dashboard"));
  expect(hrefs).toEqual(destinations);
  expect(html).toContain('aria-current="page"');
  for (const path of ["/dashboard/routes", "/dashboard/rewards/orders/order", "/dashboard/settings/privacy", "/dashboard/rewards/orders/order", "/dashboard/routes"]) {
    expect(resolveActiveNavigationHref(path, destinations)).toBe(path.startsWith('/dashboard/rewards') ? '/dashboard/rewards' : path.startsWith('/dashboard/settings') ? '/dashboard/settings' : path);
  }
});
it("removes obsolete pages, adapters and executable Community actions", async () => {
  for (const path of ["app/dashboard/community/page.tsx", "app/dashboard/partners/page.tsx", "app/dashboard/rewards/shop/page.tsx", "app/dashboard/account/page.tsx", "app/dashboard/privacy/page.tsx", "lib/platform/communityPlatform.ts", "components/rider/CommunityActionForm.tsx"]) expect(existsSync(path)).toBe(false);
  expect(readFileSync("app/actions/rider.ts", "utf8")).not.toContain("communityRideAction");
  const platform = readFileSync("lib/platform/riderPlatform.ts", "utf8");
  expect(platform).not.toContain("listRewardsCatalog");
  expect(platform).not.toMatch(/checkout|\/rewards\/redeem/);
});
it("preserves Wallet totals, redemption history and links to owned credential detail", async () => {
  const html = renderToStaticMarkup(await RewardsPage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("Available points");
  expect(html).toContain('/api/dashboard/rewards/export');
  expect(html).toContain("70");
  expect(html).toContain("Earned achievements");
  expect(html).toContain("Existing reward");
  expect(html).toContain('/dashboard/rewards/orders/order');
  expect(html).not.toContain('/dashboard/rewards/shop');
  expect(state.rewards).toHaveBeenCalledOnce();
  expect(state.orders).toHaveBeenCalledOnce();
});
it("keeps equipment and preferences in Settings with the canonical self-service readers", async () => {
  const html = renderToStaticMarkup(await SelfServicePage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("Campaign equipment");
  expect(html).toContain("Brand preferences");
  expect(state.feature.mock.calls.map(call => call[0])).toEqual(["accessories", "brands", "impact"]);
});
it("keeps personal export, deletion disclosure and support in Settings", async () => {
  const html = renderToStaticMarkup(await PrivacyPage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain('/api/dashboard/account/export');
  expect(html).toContain('name="accountId" value="account"');
  expect(html).toContain('deletion-disclosure');
  expect(html).toContain('privacy@movrr.nl');
});
