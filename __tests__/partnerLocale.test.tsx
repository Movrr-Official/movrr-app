import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), get: vi.fn(), set: vi.fn(), revalidate: vi.fn(), confirm: vi.fn(), cancel: vi.fn() }));
vi.mock("@/lib/appUser", () => ({ requirePartnerSession: mocks.guard }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.get, set: mocks.set }) }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), redirect: (url: string) => { throw new Error(url); } }));
vi.mock("@/lib/notifications", () => ({}));
vi.mock("@/services/partner", () => ({ confirmPartnerCollection: mocks.confirm, cancelPartnerFulfilment: mocks.cancel }));
import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerDutch, partnerText } from "@/lib/partnerLocale";
import { changePartnerLanguageAction, confirmCollectionAction, cancelCollectionAction } from "@/app/actions/partner";
import { StaffTable } from "@/components/partner/StaffTable";
import { CollectionsTable } from "@/components/partner/CollectionsTable";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.guard.mockResolvedValue({ authUser: { id: "actor" }, appUser: { languagePreference: "nl-NL" }, partnerContext: { capabilities: [] } });
  mocks.get.mockReturnValue(undefined);
});
it("uses the canonical profile language and ignores other actors and malformed cookies", async () => {
  expect(await getPartnerLocale()).toBe("nl");
  for (const value of ['{"actor":"other","locale":"en"}', 'invalid', '{"actor":"actor","locale":"de"}']) {
    mocks.get.mockReturnValue({ value }); expect(await getPartnerLocale()).toBe("nl");
  }
  mocks.get.mockReturnValue({ value: '{"actor":"actor","locale":"en"}' }); expect(await getPartnerLocale()).toBe("en");
});
it("persists only a valid presentation preference behind the Partner session guard", async () => {
  const form = new FormData(); form.set("locale", "nl"); await changePartnerLanguageAction(form);
  expect(mocks.set).toHaveBeenCalledWith("movrr-partner-locale", JSON.stringify({ actor: "actor", locale: "nl" }), expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/dashboard" }));
  expect(mocks.revalidate).toHaveBeenCalledWith("/dashboard", "layout");
  mocks.set.mockClear(); form.set("locale", "de"); await changePartnerLanguageAction(form); expect(mocks.set).not.toHaveBeenCalled();
  mocks.guard.mockRejectedValue(new Error("denied")); form.set("locale", "en"); await expect(changePartnerLanguageAction(form)).rejects.toThrow("denied"); expect(mocks.set).not.toHaveBeenCalled();
});
it("localizes management controls and empty states using the same preference", async () => {
  const staff = renderToStaticMarkup(await StaffTable({ members: [], canManage: true, actorRole: "owner" }));
  expect(staff).toContain("Uitnodigen"); expect(staff).toContain("E-mailadres"); expect(staff).not.toContain("Invite staff");
  expect(renderToStaticMarkup(await CollectionsTable({ items: [] }))).toContain(partnerText("nl", "No pending collections"));
});
it("localizes denials and still stops commands before unauthorized financial actions", async () => {
  await expect(confirmCollectionAction(new FormData())).rejects.toThrow(encodeURIComponent(partnerText("nl", "Your role cannot confirm collections.")).replace(/%20/g, "+"));
  await expect(cancelCollectionAction(new FormData())).rejects.toThrow("/dashboard/collections?error=");
  expect(mocks.confirm).not.toHaveBeenCalled(); expect(mocks.cancel).not.toHaveBeenCalled();
});
it("keeps dynamic receipt feedback translated and all approved Dutch entries nonempty", () => {
  expect(partnerText("nl", "Imported 2 code(s).")).toBe("2 codes ge\u00efmporteerd.");
  expect(Object.values(partnerDutch).every(value => value.trim().length > 0)).toBe(true);
});
