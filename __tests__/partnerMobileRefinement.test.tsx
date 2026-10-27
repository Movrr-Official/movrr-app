// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import sharp from "sharp";
const routeState = vi.hoisted(() => ({ pathname: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => routeState.pathname, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/actions/partner", () => ({ changePartnerLanguageAction: vi.fn(), getPartnerNotificationPreviewAction: vi.fn(async () => []) }));
import { PartnerMobileShell } from "@/components/partner/PartnerMobileShell";
import { PartnerAppStatus } from "@/components/partner/PartnerAppStatus";
import manifest from "@/lib/partnerManifest";
import workspaceManifest from "@/app/manifest";

it("keeps preferences out of the mobile header and links the partner context to Account", () => {
  const html = renderToStaticMarkup(<PartnerMobileShell session={{ authUserId: "test", role: "partner", name: "Partner", email: "isolated@invalid.test", partnerLocale: "en" }}>Screen</PartnerMobileShell>);
  const header = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
  expect(header).toContain('href="/dashboard/more"');
  expect(header).toContain("MOVRR Partner");
  expect(header).toContain('aria-label="Notifications"');
  expect(header).not.toContain('aria-label="Language:');
  expect(header).not.toContain('aria-label="Install');
  expect(html.match(/aria-current="page"/g)).toHaveLength(1);
});

it("provides one localized screen header with contextual Back and minimal Scan chrome", () => {
  const session = { authUserId: "test", role: "partner" as const, name: "Partner", email: "isolated@invalid.test", partnerLocale: "en" as const };
  try {
    for (const [path, title, back] of [["/dashboard/rewards", "Rewards", false], ["/dashboard/collections", "Activity", false], ["/dashboard/more", "Account", false], ["/dashboard/validate", "Scan", false], ["/dashboard/rewards/create", "Create reward", true], ["/dashboard/rewards/id/edit", "Edit reward", true], ["/dashboard/staff", "Team", true]]) {
      routeState.pathname = path as string;
      const html = renderToStaticMarkup(<PartnerMobileShell session={session}>Content</PartnerMobileShell>);
      const header = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
      expect(header.match(/<h1/g)).toHaveLength(1);
      expect(header).toContain(`>${title}</h1>`);
      expect(header).not.toContain("MOVRR Partner");
      expect(header.includes('aria-label="Back"')).toBe(back);
      if (back || path === "/dashboard/validate") expect(header).not.toContain('aria-label="Notifications"');
    }
    routeState.pathname = "/dashboard/rewards";
    expect(renderToStaticMarkup(<PartnerMobileShell session={{...session, partnerLocale:"nl"}}>Content</PartnerMobileShell>)).toContain(">Beloningen</h1>");
  } finally { routeState.pathname = "/dashboard"; }
});

it("makes language an explicit Account preference in both languages while preserving desktop controls", () => {
  for (const [locale, label, value] of [["en", "Language", "English"], ["nl", "Taal", "Nederlands"]] as const) {
    const account = renderToStaticMarkup(<PartnerAppStatus locale={locale} presentation="mobile-account" />);
    expect(account).toContain(`>${label}</span>`);
    expect(account).toContain(`>${value}</span>`);
    expect(account).not.toContain("partner-account-install"); // No install flash before display mode is resolved.
    const desktop = renderToStaticMarkup(<PartnerAppStatus locale={locale} />);
    expect(desktop).toContain(`aria-label="${label}: ${value}"`);
    expect(desktop).not.toContain("partner-account-language");
    expect(desktop).not.toContain("partner-account-install");
  }
});

it("separates Partner installation identity/assets from the existing web workspace", async () => {
  const partner = manifest();
  expect(partner.name).toBe("MOVRR Partner"); expect(partner.short_name).toBe("MOVRR Partner");
  expect(partner.id).toBe(workspaceManifest().id);
  expect(workspaceManifest().short_name).toBe("MOVRR");
  for (const icon of partner.icons!) {
    expect(icon.src).toMatch(/^\/pwa\/partner\//);
    const meta = await sharp(readFileSync(`public${icon.src}`)).metadata();
    expect(`${meta.width}x${meta.height}`).toBe(icon.sizes);
  }
  const { data, info } = await sharp("public/pwa/partner/icon-512.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixel = (x: number, y: number) => [...data.subarray((y * info.width + x) * 4, (y * info.width + x) * 4 + 4)];
  for (const [x, y] of [[0,0],[511,0],[0,511],[511,511],[256,256],[64,64]]) expect(pixel(x,y)).toEqual([18,60,44,255]);
  let minX=info.width,maxX=0,minY=info.height,maxY=0,green=0;
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) {
    const index=(y*info.width+x)*4;
    if(data[index+3]!==255) throw new Error("Installation icon must be opaque");
    if(data[index+1]>119) {minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);green++;}
  }
  expect((maxX-minX)/info.width).toBeGreaterThan(.67); expect((maxX-minX)/info.width).toBeLessThan(.7);
  expect((maxY-minY)/info.height).toBeGreaterThan(.61); expect((maxY-minY)/info.height).toBeLessThan(.64);
  expect(green).toBeGreaterThan(10000);
  expect((await sharp("public/pwa/partner/header-mark.png").ensureAlpha().raw().toBuffer())[3]).toBe(0);
  for(const file of ["maskable-512.png","apple-touch-icon.png"]) {
    const bytes=await sharp(`public/pwa/partner/${file}`).ensureAlpha().raw().toBuffer();
    expect([...bytes.subarray(0,4)]).toEqual([18,60,44,255]);
  }
});

it("keeps mobile browser chrome through metadata replacement and restores web chrome on exit", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  const style = document.createElement("style"); style.textContent = ".partner-mobile-app{--background:#f5f5f3}.dark .partner-mobile-app{--background:#081b10}.partner-mobile-app[data-screen=validate]{--background:#101611}";
  const meta = document.createElement("meta"); meta.name = "theme-color"; meta.content = "#123c2c";
  document.head.append(style, meta);
  const host = document.createElement("div"); document.body.append(host); const root = createRoot(host);
  try {
    await act(async () => root.render(<PartnerMobileShell session={{ authUserId: "test", role: "partner", name: "Partner", email: "isolated@invalid.test" }}>Screen</PartnerMobileShell>));
    expect(meta.content).toBe("#f5f5f3");
    const nextViewport = document.createElement("meta"); nextViewport.name = "theme-color"; nextViewport.content = "#123c2c";
    await act(async () => { meta.replaceWith(nextViewport); await Promise.resolve(); });
    expect(nextViewport.content).toBe("#f5f5f3");
    await act(async () => { host.querySelector("[data-screen]")!.setAttribute("data-screen", "validate"); await Promise.resolve(); });
    expect(nextViewport.content).toBe("#101611");
    await act(async () => { host.querySelector("[data-screen]")!.setAttribute("data-screen", "dashboard"); await Promise.resolve(); });
    expect(nextViewport.content).toBe("#f5f5f3");
    await act(async () => { document.documentElement.classList.add("dark"); await Promise.resolve(); });
    expect(nextViewport.content).toBe("#081b10");
    await act(async () => root.unmount()); expect(nextViewport.content).toBe("#123c2c");
  } finally {
    await act(async () => root.unmount()); host.remove(); style.remove();
    document.querySelector('meta[name="theme-color"]')?.remove(); document.documentElement.classList.remove("dark"); vi.unstubAllGlobals();
  }
});

it("hides mobile installation in installed displays and after installation across Account remounts", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const host = document.createElement("div"); document.body.append(host);
  let root = createRoot(host);
  try {
    for (const mode of ["standalone", "fullscreen", "minimal-ui", "ios"]) {
      vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === `(display-mode: ${mode})`, addEventListener() {}, removeEventListener() {} }));
      Object.defineProperty(navigator, "standalone", { configurable: true, value: mode === "ios" });
      await act(async () => root.render(<PartnerAppStatus presentation="mobile-account" />));
      expect(host.querySelector(".partner-account-install")).toBeNull();
      expect(host.querySelector(".partner-account-language")).not.toBeNull();
      await act(async () => root.unmount()); root = createRoot(host);
    }
    Object.defineProperty(navigator, "standalone", { configurable: true, value: false });
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    await act(async () => root.render(<PartnerAppStatus presentation="mobile-account" />));
    expect(host.querySelector(".partner-account-install")).not.toBeNull();
    await act(async () => window.dispatchEvent(new Event("appinstalled")));
    expect(host.querySelector(".partner-account-install")).toBeNull();
    await act(async () => root.unmount()); root = createRoot(host);
    await act(async () => root.render(<PartnerAppStatus presentation="mobile-account" />));
    expect(host.querySelector(".partner-account-install")).toBeNull();
  } finally {
    await act(async () => root.unmount()); host.remove();
    Reflect.deleteProperty(navigator, "standalone"); vi.unstubAllGlobals();
  }
});
