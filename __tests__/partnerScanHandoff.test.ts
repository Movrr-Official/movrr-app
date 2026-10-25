import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ signedIn: false }));
vi.mock("@/lib/env", () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://example.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: "isolated" }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: state.signedIn ? { id: "existing-test-actor" } : null } }) } }) }));
import { proxy } from "@/proxy";
beforeEach(() => { state.signedIn = false; });
it("returns the unauthenticated phone to the exact scanner route after normal sign-in", async () => {
  const result = await proxy(new NextRequest("https://workspace.invalid/dashboard/validate?token=must-not-transfer&redirectTo=https://outside.invalid"));
  const target = new URL(result.headers.get("location")!);
  expect(target.origin).toBe("https://workspace.invalid"); expect(target.pathname).toBe("/auth/signin");
  expect([...target.searchParams]).toEqual([["redirectTo", "/dashboard/validate"]]);
});
it("preserves the signed-in phone session and existing redirects for other routes", async () => {
  state.signedIn = true;
  expect((await proxy(new NextRequest("https://workspace.invalid/dashboard/validate"))).headers.get("location")).toBeNull();
  state.signedIn = false;
  expect((await proxy(new NextRequest("https://workspace.invalid/dashboard/settings"))).headers.get("location")).toBe("https://workspace.invalid/auth/signin");
});
