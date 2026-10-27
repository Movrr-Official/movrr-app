// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ mobile:true, router:{push:vi.fn()} }));
vi.mock("@/lib/usePartnerMobile", () => ({usePartnerMobile:()=>state.mobile}));
vi.mock("next/navigation", () => ({usePathname:()=>"/dashboard/rewards/create",useRouter:()=>state.router}));
import { PartnerMobileForm } from "@/components/partner/PartnerMobileForm";
let host:HTMLDivElement,root:Root;
const pause=()=>new Promise(resolve=>setTimeout(resolve,40));
beforeEach(()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true}); state.mobile=true;state.router.push.mockClear();
 window.history.replaceState({},"","/dashboard/rewards/create");
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute("open","")};
 HTMLDialogElement.prototype.close=function(){this.removeAttribute("open")};
 host=document.createElement("div");document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
const content=<><label>Title<input name="title" required/></label><label>Points<input name="pointsCost" type="number" min="0" required/></label><textarea name="codes"/><input name="imageFile" type="file"/><button>Save</button><a href="/dashboard/rewards">Cancel</a></>;
const render=async(locale:"en"|"nl"="en",action:React.ComponentProps<"form">["action"]="/canonical")=>{await act(async()=>root.render(<PartnerMobileForm locale={locale} action={action}>{content}</PartnerMobileForm>));};
const edit=async(value:string)=>{await act(async()=>{const field=host.querySelector<HTMLInputElement>('[name=title]')!;field.value=value;field.dispatchEvent(new Event("input",{bubbles:true}));});};

it("preserves the exact desktop form markup and action",()=>{
 state.mobile=false;
 expect(renderToStaticMarkup(<PartnerMobileForm locale="en" action="/canonical" className="existing">{content}</PartnerMobileForm>)).toBe(renderToStaticMarkup(<form action="/canonical" className="existing">{content}</form>));
});
it("localizes inline constraint errors and connects them to the actual fields",async()=>{
 await render("nl");await act(async()=>{host.querySelector("form")!.requestSubmit();});
 const field=host.querySelector<HTMLInputElement>('[name=title]')!;
 expect(field.getAttribute("aria-invalid")).toBe("true");
 expect(document.getElementById(field.getAttribute("aria-describedby")!)?.textContent).toBe("Vul dit veld in.");
 expect(host.querySelector('[role=alert]')?.textContent).toContain("gemarkeerde");
 expect(host.querySelector('[name=pointsCost]')?.getAttribute("inputmode")).toBe("numeric");
 expect(host.querySelector('[name=codes]')?.getAttribute("aria-label")).toBe("Vouchercodes");
 await edit("Local test draft");expect(field.getAttribute("aria-invalid")).toBeNull();
});
it("keeps editor values in memory and protects link navigation without saving",async()=>{
 await render();expect(window.history.state.movrrPartnerEditor).toBeUndefined();
 await edit("PRIVATE-DRAFT-CONTENT");
 expect(window.history.state.movrrPartnerEditor).toBeTruthy();expect(JSON.stringify(window.history.state)).not.toContain("PRIVATE");
 await act(async()=>host.querySelector<HTMLAnchorElement>("a")!.click());
 expect(host.querySelector("dialog")?.hasAttribute("open")).toBe(true);expect(state.router.push).not.toHaveBeenCalled();
 await act(async()=>host.querySelector<HTMLButtonElement>(".partner-leave-stay")!.click());
 expect(host.querySelector("dialog")?.hasAttribute("open")).toBe(false);expect(host.querySelector<HTMLInputElement>('[name=title]')?.value).toBe("PRIVATE-DRAFT-CONTENT");
 await act(async()=>{host.querySelector<HTMLAnchorElement>("a")!.click();});
 await act(async()=>{host.querySelectorAll<HTMLButtonElement>("dialog button")[1].click();await pause();});
 expect(state.router.push).toHaveBeenCalledExactlyOnceWith("/dashboard/rewards");
});
it("runs the supplied action once with unchanged field data after consuming its history guard",async()=>{
 const action=vi.fn(async(data:FormData)=>{void data;});await render("en",action);
 await edit("Local draft");host.querySelector<HTMLInputElement>('[name=pointsCost]')!.value="20";
 await act(async()=>{host.querySelector("form")!.requestSubmit();host.querySelector("form")!.requestSubmit();await pause();});
 expect(action).toHaveBeenCalledTimes(1);
 expect(action.mock.calls[0][0].get("title")).toBe("Local draft");expect(action.mock.calls[0][0].get("pointsCost")).toBe("20");
 expect(window.history.state.movrrPartnerEditor).toBeUndefined();
});
