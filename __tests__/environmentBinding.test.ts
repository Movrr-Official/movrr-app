import { afterEach, beforeEach, expect, it, vi } from "vitest";
beforeEach(() => {
  vi.resetModules();
  for (const [key, value] of Object.entries({ NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "https://app.movrr.nl", NEXT_PUBLIC_SITE_URL: "https://app.movrr.nl", NEXT_PUBLIC_SUPABASE_URL: "https://isolated.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "isolated-public-key", NEXT_PUBLIC_USE_MOCK_DATA: "false", APP_URL: "https://app.movrr.nl", SUPABASE_URL: "https://isolated.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "isolated-test-only" })) vi.stubEnv(key, value);
  vi.stubEnv("PLATFORM_API_URL", undefined);
});
afterEach(() => vi.unstubAllEnvs());
it("rejects the development fallback in production", async () => {
  await expect(import("@/lib/env")).rejects.toThrow("PLATFORM_API_URL");
});
it.each(["http://localhost:3000/api", "https://localhost/api", "https://admin.movrr.nl", "https://127.0.0.1/api"])("rejects invalid production binding %s", async value => {
  vi.stubEnv("PLATFORM_API_URL", value);
  await expect(import("@/lib/env")).rejects.toThrow("PLATFORM_API_URL");
});
it("uses the intended production API binding", async () => {
  vi.stubEnv("PLATFORM_API_URL", "https://admin.movrr.nl/api");
  expect((await import("@/lib/env")).PLATFORM_API_URL).toBe("https://admin.movrr.nl/api");
});
it("retains the local development default", async () => {
  vi.stubEnv("NODE_ENV", "development");
  expect((await import("@/lib/env")).PLATFORM_API_URL).toBe("http://localhost:3000/api");
});
