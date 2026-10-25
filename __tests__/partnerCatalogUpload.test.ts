import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ guard: vi.fn(), fetch: vi.fn() }));
vi.mock("@/lib/appUser", () => ({ requirePartnerSession: state.guard }));
vi.mock("@/lib/platform/client", () => ({ platformFetch: state.fetch, createCorrelationId: () => "operation" }));
import { createPartnerCatalogItem, updatePartnerCatalogItem } from "@/lib/platform/partnerCatalogPlatform";
beforeEach(() => { vi.resetAllMocks(); state.fetch.mockResolvedValue({ id: "reward", updated_at: "version", thumbnail_url: "https://images.example/new.png" }); });
it("forwards a selected image as binary multipart with the whitelisted catalog payload", async () => {
  const form = new FormData(); form.set("imageFile", new File(["image bytes"], "image.png", { type: "image/png" })); form.set("untrusted", "ignored");
  expect(await createPartnerCatalogItem({ title: "Reward", pointsCost: 0 }, form)).toMatchObject({ id: "reward", updatedAt: "version", thumbnailUrl: "https://images.example/new.png" });
  const body = state.fetch.mock.calls[0][1].body as FormData;
  expect(body.get("imageFile")).toBeInstanceOf(File); expect(JSON.parse(String(body.get("payload")))).toEqual({ title: "Reward", pointsCost: 0 }); expect(body.has("untrusted")).toBe(false);
});
it("forwards removal with the viewed version, without accepting a URL from the form", async () => {
  const form = new FormData(); form.set("removeImage", "true"); form.set("thumbnailUrl", "https://foreign.example/image");
  await updatePartnerCatalogItem("reward", { expectedUpdatedAt: "version" }, form);
  const body = state.fetch.mock.calls[0][1].body as FormData;
  expect(body.get("removeImage")).toBe("true"); expect(body.has("thumbnailUrl")).toBe(false); expect(JSON.parse(String(body.get("payload")))).toEqual({ expectedUpdatedAt: "version" });
});
it("does not forward uploads when the Partner session is denied", async () => {
  state.guard.mockRejectedValue(new Error("Denied"));
  await expect(createPartnerCatalogItem({ title: "Reward", pointsCost: 0 }, new FormData())).rejects.toThrow("Denied"); expect(state.fetch).not.toHaveBeenCalled();
});
it("exposes partial creation as an existing draft with a recoverable image warning", async () => {
  state.fetch.mockResolvedValue({ id: "saved-draft", updated_at: "version", imageUploadFailed: true });
  expect(await createPartnerCatalogItem({ title: "Reward", pointsCost: 0 }, new FormData())).toMatchObject({ id: "saved-draft", imageUploadFailed: true });
});
