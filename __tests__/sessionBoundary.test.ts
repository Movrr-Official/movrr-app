import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  status: "active",
  id: "11111111-1111-4111-8111-111111111111",
  fail: false,
  profiles: 1,
}));
vi.mock("@/lib/env", () => ({
  NEXT_PUBLIC_SUPABASE_URL: "https://isolated.test",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
}));
vi.mock("@/lib/platform/client", () => ({
  platformFetch: async () => {
    throw new Error("No organisation membership");
  },
}));
vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: state.id, email: "test@isolated.test" } },
        error: null,
      }),
    },
  }),
}));
vi.mock("@/lib/supabase-admin", () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => ({
      select() {
        return this;
      },
      eq() {
        return this;
      },
      maybeSingle: async () => ({
        data:
          table === "user"
            ? {
                id: state.id,
                email: "test@isolated.test",
                name: "Test",
                status: state.status,
                role: "rider",
              }
            : { language: "nl-NL" },
        error: state.fail ? { message: "offline" } : null,
      }),
      limit: async () => ({
        data: Array.from({ length: state.profiles }, (_, i) => ({
          id: String(i),
          city: "Amsterdam",
        })),
        error: null,
      }),
    }),
  }),
}));
import { getAuthenticatedAppUser, getRiderProductSession } from "@/lib/appUser";
beforeEach(() =>
  Object.assign(state, {
    status: "active",
    fail: false,
    profiles: 1,
    id: "11111111-1111-4111-8111-111111111111",
  }),
);
it("allows an eligible rider and reads the canonical language preference", async () =>
  expect((await getAuthenticatedAppUser())?.appUser).toMatchObject({
    status: "active",
    languagePreference: "nl-NL",
  }));
it.each(["suspended", "blocked", "deleted", "inactive", "unknown", ""])(
  "rejects existing-session access for %s",
  async (status) => {
    state.status = status;
    expect(await getAuthenticatedAppUser()).toBeNull();
  },
);
it("fails closed on account lookup errors", async () => {
  state.fail = true;
  expect(await getAuthenticatedAppUser()).toBeNull();
});
it("does not reuse an earlier account identity after switching", async () => {
  const a = await getAuthenticatedAppUser();
  state.id = "22222222-2222-4222-8222-222222222222";
  const b = await getAuthenticatedAppUser();
  expect(a?.appUser.id).not.toBe(b?.appUser.id);
});
it("rejects duplicate rider identities rather than merging wallets", async () => {
  state.profiles = 2;
  await expect(getRiderProductSession()).rejects.toThrow(
    "identity requires operational review",
  );
});
