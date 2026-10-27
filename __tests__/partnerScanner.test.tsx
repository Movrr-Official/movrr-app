// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ decode: vi.fn(), validate: vi.fn() }));
vi.mock("jsqr", () => ({ default: state.decode }));
vi.mock("@/app/actions/partner", () => ({ validateTokenAction: state.validate }));
import { ValidateTokenForm } from "@/components/partner/ValidateTokenForm";
let root: Root, host: HTMLDivElement;
const stop = vi.fn();
let media: ReturnType<typeof vi.fn>;
let mobile = true;
const deviceListeners = new Set<() => void>();
const handoff = { handoffUrl: "https://app.movrr.nl/dashboard/validate", handoffQr: "data:image/png;base64,AA==" };
beforeEach(() => {
  mobile = true; deviceListeners.clear();
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: mobile, addEventListener: (_event: string, fn: () => void) => deviceListeners.add(fn), removeEventListener: (_event: string, fn: () => void) => deviceListeners.delete(fn) }) });
  vi.clearAllMocks(); Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  media = vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] });
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: media } });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn(), getImageData: () => ({ data: new Uint8ClampedArray(16), width: 2, height: 2 }) } as never);
  for (const [key,value] of [["readyState",2],["videoWidth",2],["videoHeight",2]]) Object.defineProperty(HTMLVideoElement.prototype, key, { configurable: true, value });
  state.decode.mockReturnValue({ data: "a".repeat(64) });
  state.validate.mockResolvedValue({ outcome: "retry" });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
const button = (text: string) => [...host.querySelectorAll("button")].find(el => el.textContent === text)!;
const start = async () => { await act(async () => { button("Start camera").click(); await new Promise(resolve => setTimeout(resolve, 30)); }); };
it("captures once with rear camera, stops tracks and waits for explicit validation", async () => {
  await act(async () => root.render(<ValidateTokenForm {...handoff} canValidate />)); await start();
  expect(media).toHaveBeenCalledWith({ video: { facingMode: { ideal: "environment" } }, audio: false });
  expect(stop).toHaveBeenCalled(); expect(state.validate).not.toHaveBeenCalled();
  expect(host.querySelector<HTMLInputElement>('[name="token"]')?.value).toBe("a".repeat(64));
  const operation = host.querySelector<HTMLInputElement>('[name="operationId"]')!.value;
  for (let i = 0; i < 2; i++) await act(async () => { host.querySelector("form")!.requestSubmit(); });
  expect(state.validate).toHaveBeenCalledTimes(2);
  for (const [,data] of state.validate.mock.calls) expect(data.get("operationId")).toBe(operation);
  expect(document.activeElement?.getAttribute("role")).toBe("alert");
  expect(host.querySelector('.partner-scan-ready')).toBeNull();
});
it("disables camera and validation offline; viewers never request camera access", async () => {
  await act(async () => root.render(<ValidateTokenForm {...handoff} canValidate={false} />));
  expect(host.textContent).toContain("Your role cannot validate"); expect(media).not.toHaveBeenCalled();
  Object.defineProperty(navigator,"onLine",{configurable:true,value:false});
  await act(async () => { root.render(<ValidateTokenForm {...handoff} canValidate />); window.dispatchEvent(new Event("offline")); });
  expect(button("Start camera").disabled).toBe(true); expect(button("Validate reward")).toBeUndefined();
  Object.defineProperty(navigator,"onLine",{configurable:true,value:true});
  await act(async () => { window.dispatchEvent(new Event("online")); }); await start();
  Object.defineProperty(navigator,"onLine",{configurable:true,value:false});
  await act(async () => { window.dispatchEvent(new Event("offline")); });
  expect(button("Validate reward").disabled).toBe(true);
});
it("offers manual fallback on camera denial and supports Dutch", async () => {
  media.mockRejectedValue(new DOMException("denied", "NotAllowedError"));
  await act(async () => root.render(<ValidateTokenForm {...handoff} canValidate />)); await start();
  expect(host.textContent).toContain("Camera unavailable");
  await act(async () => root.render(<ValidateTokenForm {...handoff} canValidate initialLocale="nl" />));
  expect(host.textContent).toContain("Camera niet beschikbaar"); expect(host.textContent).toContain("Voer een code in");
});
it("releases a camera permission request that resolves after navigation", async () => {
  let grant!: (stream: unknown) => void;
  media.mockReturnValue(new Promise(resolve => { grant=resolve; }));
  await act(async () => root.render(<ValidateTokenForm {...handoff} canValidate />)); await start();
  await act(async () => root.render(<p>Another page</p>));
  await act(async () => grant({ getTracks: () => [{ stop }] })); expect(stop).toHaveBeenCalled();
});

it("directs desktop users to their phone without camera or token entry, including Dutch", async () => {
  mobile = false;
  await act(async () => root.render(<ValidateTokenForm {...handoff} canValidate />));
  expect(host.textContent).toContain("Continue on your phone");
  expect(host.querySelector('video,form,[name="token"]')).toBeNull();
  expect(button("Start camera")).toBeUndefined(); expect(media).not.toHaveBeenCalled();
  expect(host.querySelector<HTMLInputElement>('#phone-scanner-link')?.value).toBe(handoff.handoffUrl);
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  await act(async () => button("Copy link").click());
  expect(writeText).toHaveBeenCalledWith(handoff.handoffUrl); expect(host.textContent).toContain("Link copied.");
  await act(async () => root.render(<ValidateTokenForm {...handoff} canValidate initialLocale="nl" />));
  expect(host.textContent).toContain("Ga verder op je telefoon");
});
it("provides a selectable link when clipboard access fails", async () => {
  mobile = false;
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
  await act(async () => root.render(<ValidateTokenForm {...handoff} canValidate />));
  await act(async () => button("Copy link").click());
  expect(host.textContent).toContain("Select and copy"); expect(document.activeElement?.id).toBe("phone-scanner-link");
});
it("releases an active camera when the device no longer supports the mobile scanner", async () => {
  state.decode.mockReturnValue(null);
  await act(async () => root.render(<ValidateTokenForm {...handoff} canValidate />)); await start();
  expect(media).toHaveBeenCalledTimes(1); stop.mockClear();
  await act(async () => { mobile = false; deviceListeners.forEach(change => change()); });
  expect(stop).toHaveBeenCalled(); expect(host.querySelector('video')).toBeNull(); expect(host.textContent).toContain("Continue on your phone");
  await act(async () => { mobile = true; deviceListeners.forEach(change => change()); });
  expect(media).toHaveBeenCalledTimes(1); expect(button("Start camera")).toBeDefined();
});

it("shows real validation pending, then offers review without claiming handover completion", async () => {
  let finish!: (value: { outcome:"validated"; fulfilmentId:string }) => void;
  state.validate.mockReturnValue(new Promise(resolve=>{finish=resolve;}));
  await act(async()=>root.render(<ValidateTokenForm {...handoff} canValidate/>));await start();
  await act(async()=>{host.querySelector("form")!.requestSubmit();});
  expect(host.querySelector('.partner-camera')?.getAttribute('aria-busy')).toBe('true');
  expect(host.querySelector('.partner-scan-checking')?.getAttribute('role')).toBe('status');
  expect(button('Start camera').disabled).toBe(true);
  await act(async()=>finish({outcome:'validated',fulfilmentId:'00000000-0000-4000-8000-000000000003'}));
  expect(host.querySelector('.partner-scan-result[data-outcome=validated]')).toBe(document.activeElement);
  expect(host.textContent).toContain('Ready to review');expect(host.textContent).not.toContain('Collection complete');
  expect(host.querySelector('a[href="/dashboard/collections/00000000-0000-4000-8000-000000000003"]')).not.toBeNull();
  expect(host.querySelector('form')).toBeNull();
});
