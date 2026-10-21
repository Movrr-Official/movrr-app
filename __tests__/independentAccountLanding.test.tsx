import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ signedIn: true, rider: false, memberships: [] as {id:string;organisationId:string;name:string;domain:string;role:string}[] }));
vi.mock("next/navigation", () => ({ redirect: (to:string) => { throw Error("redirect:"+to); } }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: vi.fn() }) }));
vi.mock("@/lib/appUser", () => ({ getAuthenticatedAppUser: async () => state.signedIn ? { appUser: {name:"Independent User",email:"independent@example.test"} } : null }));
vi.mock("@/lib/platform/workspaces", () => ({ getAccountWorkspaces: async () => ({rider:state.rider,memberships:state.memberships}) }));
import WorkspacesPage from "@/app/workspaces/page";
beforeEach(() => { Object.assign(state,{signedIn:true,rider:false,memberships:[]}); });
it("renders a valid signed-in profile-free account without requiring an organisation", async () => {
  const html=renderToStaticMarkup(await WorkspacesPage());
  expect(html).toContain("Your MOVRR account"); expect(html).toContain("Independent User");
  expect(html).toContain("Sign out");
  expect(html).not.toContain("organisation owner"); expect(html).not.toContain('name="workspace"');
});
it("renders Rider access without any organisation", async () => {
  state.rider=true;const html=renderToStaticMarkup(await WorkspacesPage());
  expect(html).toContain('value="rider"');expect(html).not.toContain("organisation owner");
});
it.each(["partner","advertiser","government"])("renders %s-only access with the exact explicit organisation", async domain => {
  state.memberships=[{id:"membership",organisationId:"exact-org",name:"Explicit Organisation",domain,role:"viewer"}];
  const html=renderToStaticMarkup(await WorkspacesPage());
  expect(html).toContain("Explicit Organisation");expect(html).toContain("Viewer");expect(html).toContain('value="exact-org"');expect(html).not.toContain('value="rider"');
});
it("requires sign-in only when authentication itself is missing", async () => {
  state.signedIn=false;await expect(WorkspacesPage()).rejects.toThrow("redirect:/auth/signin");
});
