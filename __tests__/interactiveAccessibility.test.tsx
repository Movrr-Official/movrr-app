// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import { Select } from "@/components/ui/select";
import { StatusToast } from "@/components/form/StatusToast";
let root: Root, host: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  sessionStorage.clear();
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
it("focuses visible validation feedback and keeps it out of the regular tab order", async () => {
  await act(async () => root.render(<StatusToast error="Check your profile" />));
  const alert = host.querySelector('[role="alert"]');
  expect(document.activeElement).toBe(alert);
  expect(alert?.getAttribute("tabindex")).toBe("-1");
  await act(async () => root.render(<StatusToast success="Saved" />));
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(host.querySelector('[role="status"]')?.textContent).toBe("Saved");
});
it("forwards accessible naming and validation help to the actual select trigger",async()=>{
 await act(async()=>root.render(<><p id="locale-help">Choose your supported language</p><Select name="language" aria-label="Account language" aria-describedby="locale-help" aria-invalid={true} defaultValue="en-US" options={[{value:"en-US",label:"English"},{value:"nl-NL",label:"Dutch"}]}/></>));
 const trigger=host.querySelector('[role="combobox"]')!;
 expect(trigger.getAttribute('aria-label')).toBe('Account language');expect(trigger.getAttribute('aria-describedby')).toBe('locale-help');expect(trigger.getAttribute('aria-invalid')).toBe('true');
 (trigger as HTMLElement).focus();expect(document.activeElement).toBe(trigger);expect(trigger.getAttribute('aria-expanded')).toBe('false');
});

it("opens the account-language select by keyboard and restores trigger focus on Escape",async()=>{
 const originalScroll=HTMLElement.prototype.scrollIntoView;
 HTMLElement.prototype.scrollIntoView=()=>{};
 vi.stubGlobal("ResizeObserver",class {observe(){}unobserve(){}disconnect(){}});
 try {
  await act(async()=>root.render(<Select name="language" aria-label="Account language" defaultValue="en-US" options={[{value:"en-US",label:"English"},{value:"nl-NL",label:"Dutch"}]}/>));
  const trigger=host.querySelector<HTMLElement>('[role="combobox"]')!;
  await act(async()=>{trigger.focus();trigger.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown",bubbles:true,cancelable:true}));await new Promise(resolve=>setTimeout(resolve,10));});
  expect(trigger.getAttribute('aria-expanded')).toBe('true');expect(document.querySelector('[role="listbox"]')).not.toBeNull();
  await act(async()=>{document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));await new Promise(resolve=>setTimeout(resolve,10));});
  expect(trigger.getAttribute('aria-expanded')).toBe('false');expect(document.activeElement).toBe(trigger);
 } finally {HTMLElement.prototype.scrollIntoView=originalScroll;vi.unstubAllGlobals();}
});
