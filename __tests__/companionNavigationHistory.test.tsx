// @vitest-environment jsdom
import React, { act, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { Sidebar } from "@/components/layout/Sidebar";
it("restores the selected sidebar destination through browser history back and forward", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const host = document.createElement("div"); document.body.append(host); const root = createRoot(host);
  function NavigationHarness() {
    const [pathname, setPathname] = useState(window.location.pathname);
    useEffect(() => { const sync = () => setPathname(window.location.pathname); window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); }, []);
    return <Sidebar role="rider" pathname={pathname} sidebarOpen onToggle={() => {}} onCloseMobile={() => {}} />;
  }
  const selected = () => host.querySelector('[aria-current="page"]')?.getAttribute("href");
  const traverse = (direction: "back" | "forward") => new Promise<void>(resolve => { window.addEventListener("popstate", () => resolve(), { once: true }); window.history[direction](); });
  try {
    window.history.replaceState({}, "", "/dashboard/routes");
    await act(async () => root.render(<NavigationHarness />));
    expect(selected()).toBe("/dashboard/routes");
    await act(async () => { window.history.pushState({}, "", "/dashboard/settings/privacy"); window.dispatchEvent(new PopStateEvent("popstate")); });
    expect(selected()).toBe("/dashboard/settings");
    await act(async () => traverse("back")); expect(selected()).toBe("/dashboard/routes");
    await act(async () => traverse("forward")); expect(selected()).toBe("/dashboard/settings");
    expect(host.querySelector('a[href="/dashboard/community"]')).toBeNull();
  } finally { await act(async () => root.unmount()); host.remove(); window.history.replaceState({}, "", "/"); }
});
