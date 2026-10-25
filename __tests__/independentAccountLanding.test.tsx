import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ cookieSet: vi.fn(), locale: "en-US", selected: undefined as string | undefined, signedIn: true, rider: false, memberships: [] as {id:string;organisationId:string;name:string;domain:string;role:string}[] }));
vi.mock("next/navigation", () => ({ redirect: (to:string) => { throw Error("redirect:"+to); } }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: state.cookieSet, get: (name:string) => name === "movrr-workspace" && state.selected ? {value:state.selected} : undefined }) }));
vi.mock("@/lib/appUser", () => ({ getAuthenticatedAppUser: async () => state.signedIn ? { authUser: {id:"actor"}, appUser: {languagePreference:state.locale,name:"Independent User",email:"independent@example.test"} } : null }));
vi.mock("@/lib/platform/workspaces", () => ({ getAccountWorkspaces: async () => ({rider:state.rider,memberships:state.memberships}) }));
import WorkspacesPage from "@/app/workspaces/page";
beforeEach(() => { state.cookieSet.mockClear(); Object.assign(state,{locale:"en-US",selected:undefined,signedIn:true,rider:false,memberships:[]}); });
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

it("localizes workspace choices and identifies the current workspace without exposing internal IDs", async () => {
  state.locale="nl-NL"; state.selected="exact-org";
  state.memberships=[{id:"membership",organisationId:"exact-org",name:"Explicit Organisation",domain:"partner",role:"owner"}];
  const html=renderToStaticMarkup(await WorkspacesPage());
  expect(html).toContain('lang="nl"'); expect(html).toContain("Kies je werkruimte");
  expect(html).toContain("Huidige werkruimte"); expect(html).toContain("Eigenaar");
  expect(html).not.toContain(">exact-org<");
});

it("rechecks membership when a workspace card is submitted after access was revoked", async () => {
  state.memberships=[{id:"membership",organisationId:"exact-org",name:"Explicit Organisation",domain:"partner",role:"viewer"}];
  const page=await WorkspacesPage();
  function findAction(node: unknown): ((form: FormData) => Promise<void>) | undefined {
    if (!node || typeof node !== "object") return;
    const element=node as { type?: unknown; props?: { action?: unknown; children?: unknown } };
    if (element.type === "form" && typeof element.props?.action === "function") return element.props.action as (form:FormData)=>Promise<void>;
    const children=element.props?.children;
    for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) { const action=findAction(child); if(action)return action; }
  }
  const action=findAction(page)!; expect(action).toBeTypeOf("function");
  state.memberships=[];
  const form=new FormData(); form.set("workspace","exact-org");
  await expect(action(form)).rejects.toThrow("Active workspace membership required");
});

it("carries the Partner presentation language into the account picker without changing access", async () => {
  const html=renderToStaticMarkup(await WorkspacesPage({searchParams:Promise.resolve({lang:"nl"})}));
  expect(html).toContain("Welkom bij MOVRR"); expect(html).not.toContain('name="workspace"');
  const unsupported=renderToStaticMarkup(await WorkspacesPage({searchParams:Promise.resolve({lang:"de"})}));
  expect(unsupported).toContain("Welcome to MOVRR");
});

it("passes the validated Partner presentation locale into the redirect response", async () => {
  state.memberships=[{id:"membership",organisationId:"exact-org",name:"Explicit Organisation",domain:"partner",role:"viewer"}];
  const page=await WorkspacesPage({searchParams:Promise.resolve({lang:"nl"})});
  function findAction(node: unknown): ((form: FormData) => Promise<void>) | undefined {
    if (!node || typeof node !== "object") return;
    const element=node as { type?: unknown; props?: { action?: unknown; children?: unknown } };
    if (element.type === "form" && typeof element.props?.action === "function") return element.props.action as (form:FormData)=>Promise<void>;
    const children=element.props?.children;
    for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) { const action=findAction(child); if(action)return action; }
  }
  const action=findAction(page)!; const form=new FormData(); form.set("workspace","exact-org");
  await expect(action(form)).rejects.toThrow("redirect:/dashboard");
  expect(state.cookieSet).toHaveBeenCalledWith("movrr-partner-locale", JSON.stringify({actor:"actor",locale:"nl"}), expect.objectContaining({httpOnly:true,path:"/dashboard",sameSite:"lax"}));
  state.cookieSet.mockClear(); state.signedIn=false;
  await expect(action(form)).rejects.toThrow("redirect:/auth/signin"); expect(state.cookieSet).not.toHaveBeenCalled();
});
