import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  allowed: true,
  trusted: true,
  calls: [] as Array<{ table: string; key?: string; id?: string }>,
  fail: false,
}));
vi.mock("@/lib/appUser", () => ({
  requireProductSession: async () => {
    if (!state.allowed) throw new Error("restricted");
    return { authUser: { id: "owner" }, riderProfile: { id: "owned-rider" } };
  },
}));
vi.mock("@/lib/requestProtection", () => ({
  isTrustedSameOriginRequest: () => state.trusted,
}));
vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => {
      const call: { table: string; key?: string; id?: string } = { table };
      state.calls.push(call);
      const q = {
        select() {
          return q;
        },
        eq(key: string, id: string) {
          Object.assign(call, { key, id });
          return q;
        },
        order() {
          return q;
        },
        limit() {
          return q;
        },
        gt() {
          return q;
        },
        then(resolve: (value: unknown) => unknown) {
          return Promise.resolve({
            data: [{ id: "fixture" }],
            error: state.fail ? { message: "offline" } : null,
          }).then(resolve);
        },
      };
      return q;
    },
  }),
}));
import { POST } from "@/app/api/dashboard/account/export/route";
beforeEach(() =>
  Object.assign(state, { allowed: true, trusted: true, calls: [], fail: false }),
);
it("exports only the session-bound user and rider scopes", async () => {
  const response = await POST(
    new Request("https://app.isolated.test/api/dashboard/account/export", {
      method: "POST",
    }),
  );
  expect(response.status).toBe(200);
  expect(
    state.calls.every(
      (c) =>
        c.id ===
        (["user", "user_preferences"].includes(c.table) ? "owner" : "owned-rider"),
    ),
  ).toBe(true);
  expect(response.headers.get("cache-control")).toContain("no-store");
});
it("rejects foreign-origin export requests before data access", async () => {
  state.trusted = false;
  expect(
    (await POST(new Request("https://app.isolated.test", { method: "POST" }))).status,
  ).toBe(403);
  expect(state.calls).toHaveLength(0);
});
it("rejects a suspended session before exporting data", async () => {
  state.allowed = false;
  await expect(
    POST(new Request("https://app.isolated.test", { method: "POST" })),
  ).rejects.toThrow("restricted");
  expect(state.calls).toHaveLength(0);
});
it("does not return partial exports when a data source fails", async () => {
  state.fail = true;
  const response = await POST(
    new Request("https://app.isolated.test", { method: "POST" }),
  );
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("fixture");
});
