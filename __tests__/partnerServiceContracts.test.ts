import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/lib/appUser", () => ({ requirePartnerSession: async () => ({ partnerContext: { capabilities: ["fulfilment.read", "analytics.view"], organisationId: "tenant" } }) }));
vi.mock("@/lib/platform/client", () => ({ platformFetch: state.fetch, createCorrelationId: () => "correlation" }));
import { getPartnerPendingFulfilment, listPartnerFulfilmentHistory, getPartnerDashboard, listPartnerResources, listPartnerRewards, getPartnerAnalytics, validatePartnerToken, invitePartnerStaff } from "@/services/partner";
import { getPartnerCatalogItem, updatePartnerCatalogItem } from "@/lib/platform/partnerCatalogPlatform";
beforeEach(() => vi.clearAllMocks());
it("maps canonical title, Free price, stock and version into the editor", async () => {
  state.fetch.mockResolvedValue([{ id: "reward", title: "Coffee", pointsPrice: 0, status: "draft", updatedAt: "version", inventoryCount: 0, description: "Terms", sku: "SKU", category: "voucher" }]);
  expect((await listPartnerRewards())[0]).toMatchObject({ name: "Coffee", pointsCost: 0, updatedAt: "version", stockAvailable: 0 });
  expect(await getPartnerCatalogItem("reward")).toMatchObject({ title: "Coffee", pointsCost: 0, updatedAt: "version", stockAvailable: 0, description: "Terms" });
  await updatePartnerCatalogItem("reward", { expectedUpdatedAt: "version", pointsCost: 0 });
  expect(state.fetch).toHaveBeenLastCalledWith("/partners/rewards/reward", expect.objectContaining({ body: { expectedUpdatedAt: "version", pointsCost: 0 } }));
});
it("maps the real state/count analytics payload", async () => {
  state.fetch.mockResolvedValue({ series: [{ state: "awaiting_collection", count: 4 }] });
  expect(await getPartnerAnalytics()).toEqual({ series: [{ label: "awaiting collection", value: 4 }] });
});
it("propagates dashboard outages instead of showing a false zero queue", async () => {
  state.fetch.mockRejectedValue(new Error("offline")); await expect(getPartnerDashboard()).rejects.toThrow("offline");
});
it("forwards stable scan identity and email invitations to canonical commands", async () => {
  state.fetch.mockResolvedValue({}); await validatePartnerToken("PRIVATE", "stable-operation");
  expect(state.fetch).toHaveBeenCalledWith("/partners/validate", { method: "POST", body: { token: "PRIVATE" }, idempotencyKey: "stable-operation" });
  await invitePartnerStaff({ email: "staff@example.com", role: "staff", operationToken: "a".repeat(64) });
  expect(state.fetch).toHaveBeenLastCalledWith("/organisations/tenant/invitations", { method: "POST", body: { email: "staff@example.com", role: "staff", operationToken: "a".repeat(64) } });
});

it("reopens a completed collection through the canonical tenant-scoped history read", async () => {
  state.fetch.mockImplementation(async path => path.endsWith("/history") ? [{id:"closed",state:"completed",rewardTitle:"Isolated reward",version:3}] : []);
  expect(await getPartnerPendingFulfilment("closed")).toMatchObject({id:"closed",state:"completed",version:3});
  expect(await listPartnerFulfilmentHistory()).toHaveLength(1);expect(state.fetch).toHaveBeenCalledWith("/partners/fulfilments/history");
});

it("preserves the canonical inventory thumbnail and tolerates older API responses", async () => {
  state.fetch.mockResolvedValue([{ id: "pool", name: "Pool", thumbnailUrl: "https://images.example/pool.jpg" }, { id: "legacy" }]);
  expect((await listPartnerResources()).map(row => row.thumbnailUrl)).toEqual(["https://images.example/pool.jpg", null]);
});

it("preserves the tenant-scoped catalog image for reward banners", async () => {
  state.fetch.mockResolvedValue([{ id: "reward", title: "Coffee", thumbnailUrl: "https://images.example/coffee.jpg" }]);
  expect((await listPartnerRewards())[0].thumbnailUrl).toBe("https://images.example/coffee.jpg");
  expect(state.fetch).toHaveBeenLastCalledWith("/partners/rewards");
});
