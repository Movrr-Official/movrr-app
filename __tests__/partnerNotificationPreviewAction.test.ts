import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ guard: vi.fn(), list: vi.fn() }));
vi.mock("@/lib/appUser", () => ({ requirePartnerSession: state.guard }));
vi.mock("@/services/partner", () => ({}));
vi.mock("@/lib/notifications", () => ({ listUserNotifications: state.list }));
import { getPartnerNotificationPreviewAction } from "@/app/actions/partner";

beforeEach(() => {
  vi.clearAllMocks();
  state.guard.mockResolvedValue({ authUser: { id: "auth-identity" }, appUser: { id: "canonical-account" } });
  state.list.mockResolvedValue([]);
});
it("uses the guarded account inbox and a bounded preview without accepting an identity", async () => {
  expect(await getPartnerNotificationPreviewAction()).toEqual([]);
  expect(state.list).toHaveBeenCalledExactlyOnceWith("canonical-account", "partner", 5);
});
it("does not read notifications when Partner authorization fails", async () => {
  state.guard.mockRejectedValue(new Error("denied"));
  await expect(getPartnerNotificationPreviewAction()).rejects.toThrow("denied");
  expect(state.list).not.toHaveBeenCalled();
});
it("propagates read failure instead of inventing an empty inbox", async () => {
  state.list.mockRejectedValue(new Error("unavailable"));
  await expect(getPartnerNotificationPreviewAction()).rejects.toThrow("unavailable");
});
