// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
import { PartnerMobileRewards } from "@/components/partner/PartnerMobileRewards";
import { PartnerMobileActivity } from "@/components/partner/PartnerMobileActivity";
import { PartnerPresentation } from "@/components/partner/PartnerPresentation";

it("switches complete screen compositions without placing both navigation surfaces in the DOM", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  let mobile = false; const listeners = new Set<() => void>();
  vi.stubGlobal("matchMedia", () => ({ get matches() { return mobile; }, addEventListener: (_: string, cb: () => void) => listeners.add(cb), removeEventListener: (_: string, cb: () => void) => listeners.delete(cb) }));
  const host=document.createElement("div"),root=createRoot(host);
  try {
    await act(async()=>root.render(<PartnerPresentation mobile={<h1>Mobile catalog</h1>}><h1>Desktop catalog</h1></PartnerPresentation>));
    expect(host.textContent).toBe("Desktop catalog");
    await act(async()=>{mobile=true;listeners.forEach(cb=>cb());});expect(host.textContent).toBe("Mobile catalog");
    await act(async()=>{mobile=false;listeners.forEach(cb=>cb());});expect(host.textContent).toBe("Desktop catalog");
  } finally {await act(async()=>root.unmount());vi.unstubAllGlobals();}
});

it("presents supplied catalog values and a useful search without offering edits to read-only members", async () => {
  const rewards=[{id:"free",name:"Coffee",pointsCost:0,stockAvailable:0,status:"draft"},{id:"other",name:"Museum pass",pointsCost:50,stockAvailable:12}];
  const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
  try {
    await act(async()=>root.render(<PartnerMobileRewards rewards={rewards} canManage={false} error={null} locale="en"/>));
    expect(host.textContent).toContain("Free");expect(host.textContent).toContain("Out of stock");expect(host.querySelector('a[href*=edit]')).toBeNull();expect(host.querySelector('a[href*=create]')).toBeNull();
    const input=host.querySelector("input")!;
    await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!.call(input,"museum");input.dispatchEvent(new Event("input",{bubbles:true}));});
    expect(host.querySelectorAll("article")).toHaveLength(1);expect(host.querySelector("article")?.textContent).toContain("Museum pass");
    await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!.call(input,"unknown");input.dispatchEvent(new Event("input",{bubbles:true}));});
    expect(host.textContent).toContain("No matching rewards");
    await act(async()=>host.querySelector<HTMLButtonElement>('button[aria-label="Clear search"]')!.click());expect(host.querySelectorAll("article")).toHaveLength(2);
  } finally {await act(async()=>root.unmount());host.remove();}
});

it("keeps history state and timestamps authoritative and localizes empty queues without unauthorized scan actions", () => {
  const html=renderToStaticMarkup(<PartnerMobileActivity items={[{id:"closed",rewardTitle:"Coffee",state:"completed",fulfilmentType:"physical_collection",updatedAt:"2026-10-26T12:00:00Z"},{id:"unknown"}]} history canScan={false} locale="nl"/>);
  expect(html).toContain('/dashboard/collections/closed');expect(html).toContain("Opgehaald");expect(html).toContain('dateTime="2026-10-26T12:00:00Z"');expect(html.match(/<time /g)).toHaveLength(1);
  const empty=renderToStaticMarkup(<PartnerMobileActivity items={[]} history={false} canScan={false} locale="nl"/>);
  expect(empty).toContain("Je wachtrij is leeg");expect(empty).not.toContain('href="/dashboard/validate"');
});
