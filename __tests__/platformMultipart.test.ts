import { expect, it, vi } from "vitest";
vi.mock("@/lib/env", () => ({ PLATFORM_API_URL: "https://platform.example/api" }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn() } }));
vi.mock("@/lib/supabase-server", () => ({ createSupabaseServerClient: async () => ({ auth: { getSession: async () => ({ data: { session: { access_token: "session-token" } } }) } }) }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "selected-tenant" }) }) }));
import { platformFetch } from "@/lib/platform/client";
it("preserves binary FormData and browser-generated boundary with existing identity and tenant headers", async () => {
  const body = new FormData(); body.set("imageFile", new File(["binary"], "photo.png", { type: "image/png" }));
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: { id: "reward" } })));
  await platformFetch("/partners/rewards", { method: "POST", body, fetchImpl, idempotencyKey: "operation" });
  const options = fetchImpl.mock.calls[0][1]!;
  expect(options.body).toBe(body); expect(options.cache).toBe("no-store");
  expect(options.headers).toMatchObject({ Authorization: "Bearer session-token", "x-organisation-id": "selected-tenant", "Idempotency-Key": "operation" });
  expect(options.headers).not.toHaveProperty("Content-Type");
});
it("retains JSON transport for existing commands", async () => {
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: {} })));
  await platformFetch("/partners/rewards", { method: "POST", body: { title: "Reward" }, fetchImpl });
  expect(fetchImpl.mock.calls[0][1]).toMatchObject({ body: JSON.stringify({ title: "Reward" }), headers: { "Content-Type": "application/json" } });
});
