// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard/rewards/item/edit" }));
import { RewardEditStatus } from "@/components/partner/RewardEditStatus";

it("requires an explicit withdrawal acknowledgement and defaults active edits to draft review", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const host = document.createElement("div"); document.body.append(host); const root = createRoot(host);
  try {
    await act(async () => root.render(<form><RewardEditStatus status="active" locale="en" /></form>));
    expect(host.querySelector('[role="combobox"]')?.textContent).toContain("Draft");
    expect(host.textContent).toContain("Saving changes takes this reward off sale");
    expect(host.querySelector('button[type="submit"]')?.textContent).toBe("Save draft for review");
    const acknowledgement = host.querySelector<HTMLInputElement>('input[name="acknowledgeWithdrawal"]')!;
    expect(acknowledgement.required).toBe(true); expect(host.querySelector("form")!.checkValidity()).toBe(false);
    acknowledgement.checked = true; expect(host.querySelector("form")!.checkValidity()).toBe(true);
    await act(async () => root.render(<form><RewardEditStatus key="paused" status="paused" locale="nl" /></form>));
    expect(host.querySelector('input[name="acknowledgeWithdrawal"]')).toBeNull();
    expect(host.querySelector('[role="combobox"]')?.textContent).toContain("Gepauzeerd");
    expect(host.querySelector('button[type="submit"]')?.textContent).toBe("Wijzigingen opslaan");
  } finally { await act(async () => root.unmount()); host.remove(); }
});
