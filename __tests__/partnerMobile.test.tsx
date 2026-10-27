// @vitest-environment jsdom
import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { partnerMobileParent, partnerMobileTab, partnerMobileTabs } from "@/lib/partnerMobileNavigation";
import partnerManifest from "@/lib/partnerManifest";
import { PartnerMobileHome } from "@/components/partner/PartnerMobileHome";

vi.mock("@/components/partner/PartnerDesktopShell", () => ({ PartnerDesktopShell: () => <div>Desktop workspace</div> }));
vi.mock("@/components/partner/PartnerMobileShell", () => ({ PartnerMobileShell: () => { const [value, setValue] = useState(0); return <button onClick={() => setValue(value + 1)}>Mobile app {value}</button>; } }));
import { PartnerShell } from "@/components/partner/PartnerShell";
afterEach(() => vi.restoreAllMocks());

it("selects the dedicated shell by viewport, reacts to resizing and resets private UI on identity/workspace changes", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  let mobile = false;
  const listeners = new Set<() => void>();
  vi.stubGlobal("matchMedia", (query: string) => { expect(query).toBe("(max-width: 1023px)"); return { matches: mobile, addEventListener: (_: string, fn: () => void) => listeners.add(fn), removeEventListener: (_: string, fn: () => void) => listeners.delete(fn) }; });
  const host = document.createElement("div"), root = createRoot(host);
  const session = { authUserId: "actor", partnerOrganisationId: "one", name: "Partner", email: "isolated@invalid.test", role: "partner" as const };
  try {
    await act(async () => root.render(<PartnerShell session={session}>Route</PartnerShell>)); expect(host.textContent).toBe("Desktop workspace");
    await act(async () => { mobile = true; listeners.forEach(fn => fn()); }); expect(host.textContent).toBe("Mobile app 0");
    await act(async () => host.querySelector("button")!.click()); expect(host.textContent).toBe("Mobile app 1");
    await act(async () => root.render(<PartnerShell session={{ ...session, partnerOrganisationId: "two" }}>Route</PartnerShell>)); expect(host.textContent).toBe("Mobile app 0");
    await act(async () => host.querySelector("button")!.click());
    await act(async () => root.render(<PartnerShell session={{ ...session, authUserId: "other" }}>Route</PartnerShell>)); expect(host.textContent).toBe("Mobile app 0");
    await act(async () => { mobile = false; listeners.forEach(fn => fn()); }); expect(host.textContent).toBe("Desktop workspace");
  } finally { await act(async () => root.unmount()); vi.unstubAllGlobals(); }
});

it("keeps tab roots and nested Back destinations predictable for deep links", () => {
  expect(partnerMobileTabs.map(tab => tab.label)).toEqual(["Home", "Activity", "Scan", "Rewards", "Account"]);
  for (const tab of partnerMobileTabs) expect(partnerMobileTab(tab.href)).toBe(tab.href);
  expect(partnerMobileTab("/dashboard/rewards/item/edit")).toBe("/dashboard/rewards");
  expect(partnerMobileParent("/dashboard/rewards/item/edit")).toBe("/dashboard/rewards");
  expect(partnerMobileParent("/dashboard/collections/item")).toBe("/dashboard/collections");
  expect(partnerMobileParent("/dashboard/notifications")).toBe("/dashboard/more");
  expect(partnerMobileParent("/dashboard/more")).toBeNull();
});

it("uses only supplied operational counts, localizes mobile content and respects scan/inventory permissions", () => {
  const dashboard = { organisationId: "private-org", membershipRole: "viewer" as const, pendingCount: 4, validatedCount: 2, completedCount: 13 };
  const html = renderToStaticMarkup(<PartnerMobileHome dashboard={dashboard} locale="nl" />);
  expect(html).toContain("Welkom terug");
  expect(html).toContain(">13<"); expect(html).not.toContain("private-org");
  expect(html).not.toContain('href="/dashboard/validate"'); expect(html).not.toContain('href="/dashboard/resources"');
  const manager = renderToStaticMarkup(<PartnerMobileHome dashboard={{ ...dashboard, membershipRole: "manager" }} locale="en" />);
  expect(manager).toContain('href="/dashboard/validate"'); expect(manager).toContain('href="/dashboard/resources"');
});

it("gives Partner an install identity without changing the existing app id or auth scope", () => {
  const manifest = partnerManifest();
  expect(manifest.name).toBe("MOVRR Partner"); expect(manifest.id).toBe("/");
  expect(manifest.start_url).toBe("/dashboard"); expect(manifest.scope).toBe("/"); expect(manifest.display).toBe("standalone");
});
