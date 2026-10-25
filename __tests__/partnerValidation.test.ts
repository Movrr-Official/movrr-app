import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ guard: vi.fn(), validate: vi.fn(), revalidate: vi.fn(), catalog: vi.fn(), resources: vi.fn() }));
vi.mock("@/lib/appUser", () => ({ requirePartnerSession: state.guard }));
vi.mock("@/lib/notifications", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: state.revalidate }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/services/partner", () => ({ validatePartnerToken: state.validate, importPartnerResourceCodes: state.resources }));
vi.mock("@/lib/platform/partnerCatalogPlatform", () => ({ createPartnerCatalogItem: state.catalog }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error("REDIRECT:" + url); } }));
import { validateTokenAction, createRewardCatalogAction, importResourceCodesAction } from "@/app/actions/partner";
import { PlatformApiError } from "@/lib/platform/types";
const id = "00000000-0000-4000-8000-000000000001";
function form() { const f = new FormData(); f.set("token", "a".repeat(64)); f.set("operationId", id); return f; }
beforeEach(() => { vi.clearAllMocks(); state.guard.mockResolvedValue({ partnerContext: { capabilities: ["fulfilment.validate", "rewards.manage", "resources.manage"] } }); state.validate.mockResolvedValue({ fulfilmentId: id, fulfilment: { state: "validated" } }); });
it("retains the canonical validation result and reuses the retry identity", async () => {
  for (let i = 0; i < 2; i++) expect(await validateTokenAction({}, form())).toEqual({ outcome: "validated", fulfilmentId: id });
  expect(state.validate.mock.calls).toEqual([["a".repeat(64), id], ["a".repeat(64), id]]);
  expect(state.revalidate).toHaveBeenCalledWith(`/dashboard/collections/${id}`);
});
it("denies viewers and malformed input before a command", async () => {
  state.guard.mockResolvedValue({ partnerContext: { capabilities: [] } });
  expect(await validateTokenAction({}, form())).toEqual({ outcome: "restricted" });
  expect(state.validate).not.toHaveBeenCalled();
  state.guard.mockResolvedValue({ partnerContext: { capabilities: ["fulfilment.validate"] } });
  expect(await validateTokenAction({}, new FormData())).toEqual({ outcome: "invalid" });
  expect(state.validate).not.toHaveBeenCalled();
});
it.each([["permission_denied", 403, "restricted"], ["not_found", 404, "invalid"], ["BusinessFailure", 422, "unavailable"], ["ConcurrencyConflict", 409, "unavailable"], ["infra", 0, "retry"]])("maps %s to safe merchant feedback", async (kind, status, outcome) => {
  state.validate.mockRejectedValue(new PlatformApiError({ kind: String(kind), status: Number(status), message: "PRIVATE BACKEND DETAILS" }));
  expect(await validateTokenAction({}, form())).toEqual({ outcome });
});
it("does not claim validation from a malformed success payload", async () => {
  state.validate.mockResolvedValue({ fulfilmentId: id, fulfilment: { state: "completed" } });
  expect(await validateTokenAction({}, form())).toEqual({ outcome: "retry" });
});
it("creates explicit Free drafts with zero stock without catching the successful redirect", async () => {
  state.catalog.mockResolvedValue({ id }); const f = new FormData(); f.set("title", "Free coffee"); f.set("pointsCost", "0"); f.set("stockAvailable", "0"); f.set("status", "active");
  await expect(createRewardCatalogAction(f)).rejects.toThrow(`REDIRECT:/dashboard/rewards/${id}/edit?success=`);
  expect(state.catalog).toHaveBeenCalledWith(expect.objectContaining({ pointsCost: 0, stockAvailable: 0, status: "draft" }), f);
});
it("opens the saved draft for an image retry instead of sending the merchant back to create another reward", async () => {
  state.catalog.mockResolvedValue({ id, imageUploadFailed: true });
  const f = new FormData(); f.set("title", "Reward with image"); f.set("pointsCost", "100");
  await expect(createRewardCatalogAction(f)).rejects.toThrow(`REDIRECT:/dashboard/rewards/${id}/edit?error=`);
  expect(state.catalog).toHaveBeenCalledTimes(1);
});
it("imports codes without treating a successful redirect as an error", async () => {
  state.resources.mockResolvedValue({ imported: 2 }); const f = new FormData(); f.set("resourceId", id); f.set("codes", "ONE,TWO");
  await expect(importResourceCodesAction(f)).rejects.toThrow("REDIRECT:/dashboard/resources?success=Imported");
});
it("rejects missing prices rather than inventing a free reward", async () => {
  const f = new FormData(); f.set("title", "Missing price"); await expect(createRewardCatalogAction(f)).rejects.toThrow("REDIRECT:"); expect(state.catalog).not.toHaveBeenCalled();
});
