// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ usePathname: () => window.location.pathname }));
import { usePartnerOverlay } from "@/lib/usePartnerOverlay";

it("consumes Back for overlays, preserves router state and removes stale entries before navigation", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.history.replaceState({ __NA: true, tree: "preserved" }, "", "/dashboard");
  const host = document.createElement("div"); document.body.append(host); const root = createRoot(host);
  let overlay!: ReturnType<typeof usePartnerOverlay>;
  function Harness() { overlay = usePartnerOverlay(); return <p>{String(overlay.open)}</p>; }
  const back = () => new Promise<void>(resolve => { window.addEventListener("popstate", () => resolve(), { once: true }); window.history.back(); });
  try {
    await act(async () => root.render(<Harness />));
    await act(async () => overlay.changeOpen(true));
    expect(overlay.open).toBe(true); expect(window.history.state.__NA).toBe(true);
    await act(async () => back());
    expect(overlay.open).toBe(false); expect(window.location.pathname).toBe("/dashboard");
    await act(async () => overlay.changeOpen(true));
    const destination = vi.fn(() => window.history.pushState({}, "", "/dashboard/resources"));
    await act(async () => { await new Promise<void>(resolve => overlay.close(() => { destination(); resolve(); })); });
    expect(destination).toHaveBeenCalledOnce(); expect(overlay.open).toBe(false); expect(window.location.pathname).toBe("/dashboard/resources");
    await act(async () => back()); expect(window.location.pathname).toBe("/dashboard"); expect(overlay.open).toBe(false);
  } finally { await act(async () => root.unmount()); host.remove(); window.history.replaceState({}, "", "/"); }
});

it("replaces another transient overlay instead of stacking menus", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const host = document.createElement("div"); const root = createRoot(host); let one!: ReturnType<typeof usePartnerOverlay>, two!: ReturnType<typeof usePartnerOverlay>;
  function Harness() { one = usePartnerOverlay(); two = usePartnerOverlay(); return null; }
  try {
    await act(async () => root.render(<Harness />));
    await act(async () => one.changeOpen(true)); await act(async () => two.changeOpen(true));
    expect(one.open).toBe(false); expect(two.open).toBe(true);
    await act(async () => { const popped = new Promise<void>(resolve => window.addEventListener("popstate", () => resolve(), { once: true })); two.close(); await popped; });
    expect(two.open).toBe(false);
  } finally { await act(async () => root.unmount()); window.history.replaceState({}, "", "/"); }
});
