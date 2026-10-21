import { beforeEach, expect, it, vi } from "vitest";
const signOut=vi.hoisted(()=>vi.fn(async()=>({error:null})));
vi.mock("@/lib/env",()=>({APP_URL:"https://app.example.test"}));
vi.mock("@/lib/supabase-server",()=>({createSupabaseServerClient:async()=>({auth:{signOut}})}));
import { POST } from "@/app/api/auth/signout/route";
beforeEach(()=>signOut.mockClear());
it("signs out an independent account and follows POST with a GET-safe redirect",async()=>{
  const response=await POST(new Request("https://app.example.test/api/auth/signout",{method:"POST",headers:{Origin:"https://app.example.test"}}));
  expect(signOut).toHaveBeenCalledOnce();expect(response.status).toBe(303);expect(response.headers.get("location")).toBe("https://app.example.test/auth/signin");
});
it("preserves cross-origin sign-out denial",async()=>{
  const response=await POST(new Request("https://app.example.test/api/auth/signout",{method:"POST",headers:{Origin:"https://foreign.example.test"}}));
  expect(response.status).toBe(403);expect(signOut).not.toHaveBeenCalled();
});
