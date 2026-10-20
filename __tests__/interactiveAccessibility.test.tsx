// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@/app/actions/rider", () => ({ communityRideAction: send }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import { CommunityActionForm } from "@/components/rider/CommunityActionForm";
import { CommunityFields } from "@/components/rider/CommunityFields";
import { Select } from "@/components/ui/select";
import { StatusToast } from "@/components/form/StatusToast";
let root: Root, host: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  sessionStorage.clear();
  send.mockReset();
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
it("associates schedule help and enforces browser validity before submission", async () => {
  await act(async () =>
    root.render(
      <form>
        <CommunityFields />
        <button>Save</button>
      </form>,
    ),
  );
  const title = host.querySelector<HTMLInputElement>('[name="title"]')!,
    date = host.querySelector<HTMLInputElement>('[name="scheduledAt"]')!;
  expect(title.labels?.[0]?.textContent).toContain("Ride title");
  expect(date.labels?.[0]?.textContent).toContain("Date and time");
  expect(
    document.getElementById(date.getAttribute("aria-describedby")!)?.textContent,
  ).toContain("time zone");
  expect(title.checkValidity()).toBe(false);
  title.value = "An approved ride";
  expect(title.checkValidity()).toBe(true);
  expect(date.checkValidity()).toBe(false);
  date.value = "2099-07-01T09:00";
  expect(date.checkValidity()).toBe(true);
});
it("preserves user input on server rejection, focuses the error, and retries the same operation", async () => {
  send.mockResolvedValue({ success: false, error: "Ride service unavailable" });
  await act(async () =>
    root.render(
      <CommunityActionForm create accountId="account-one">
        <input name="title" defaultValue="My ride" />
        <button>Save</button>
      </CommunityActionForm>,
    ),
  );
  const form = host.querySelector("form")!,
    input = host.querySelector<HTMLInputElement>('[name="title"]')!;
  input.value = "Changed ride title";
  await act(async () =>
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(input.value).toBe("Changed ride title");
  expect(document.activeElement).toBe(host.querySelector('[role="alert"]'));
  const first = send.mock.calls[0][1].get("operationId");
  expect(first).toBeTruthy();
  await act(async () =>
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(send.mock.calls[1][1].get("operationId")).toBe(first);
  expect(send.mock.calls[1][1].get("title")).toBe("Changed ride title");
});
it("separates interrupted operation identities when accounts switch", async () => {
  send.mockResolvedValue({ success: false, error: "Retry" });
  for (const accountId of ["one", "two"]) {
    await act(async () =>
      root.render(
        <CommunityActionForm key={accountId} create accountId={accountId}>
          <input name="title" defaultValue="Ride" />
          <button>Save</button>
        </CommunityActionForm>,
      ),
    );
    await act(async () =>
      host
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
  }
  expect(send.mock.calls[0][1].get("operationId")).not.toBe(
    send.mock.calls[1][1].get("operationId"),
  );
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
