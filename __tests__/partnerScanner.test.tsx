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
beforeEach(() => {
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
  await act(async () => root.render(<ValidateTokenForm canValidate />)); await start();
  expect(media).toHaveBeenCalledWith({ video: { facingMode: { ideal: "environment" } }, audio: false });
  expect(stop).toHaveBeenCalled(); expect(state.validate).not.toHaveBeenCalled();
  expect(host.querySelector<HTMLInputElement>('[name="token"]')?.value).toBe("a".repeat(64));
  const operation = host.querySelector<HTMLInputElement>('[name="operationId"]')!.value;
  for (let i = 0; i < 2; i++) await act(async () => { host.querySelector("form")!.requestSubmit(); });
  expect(state.validate).toHaveBeenCalledTimes(2);
  for (const [,data] of state.validate.mock.calls) expect(data.get("operationId")).toBe(operation);
  expect(document.activeElement?.getAttribute("role")).toBe("alert");
});
it("disables camera and validation offline; viewers never request camera access", async () => {
  await act(async () => root.render(<ValidateTokenForm canValidate={false} />));
  expect(host.textContent).toContain("Your role cannot validate"); expect(media).not.toHaveBeenCalled();
  Object.defineProperty(navigator,"onLine",{configurable:true,value:false});
  await act(async () => { root.render(<ValidateTokenForm canValidate />); window.dispatchEvent(new Event("offline")); });
  expect(button("Start camera").disabled).toBe(true); expect(button("Validate reward").disabled).toBe(true);
});
it("offers manual fallback on camera denial and supports Dutch", async () => {
  media.mockRejectedValue(new DOMException("denied", "NotAllowedError"));
  await act(async () => root.render(<ValidateTokenForm canValidate />)); await start();
  expect(host.textContent).toContain("Camera unavailable");
  await act(async () => { const select=host.querySelector("select")!; select.value="nl"; select.dispatchEvent(new Event("change",{bubbles:true})); });
  expect(host.textContent).toContain("Camera niet beschikbaar"); expect(host.textContent).toContain("Voer een code in");
});
it("releases a camera permission request that resolves after navigation", async () => {
  let grant!: (stream: unknown) => void;
  media.mockReturnValue(new Promise(resolve => { grant=resolve; }));
  await act(async () => root.render(<ValidateTokenForm canValidate />)); await start();
  await act(async () => root.render(<p>Another page</p>));
  await act(async () => grant({ getTracks: () => [{ stop }] })); expect(stop).toHaveBeenCalled();
});
