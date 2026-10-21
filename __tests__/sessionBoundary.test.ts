import { beforeEach, expect, it, vi } from "vitest";
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => state.selected ? { value: state.selected } : undefined }) }));
vi.mock("next/navigation", () => ({ redirect: (target: string) => { throw new Error("redirect:" + target); } }));
const state = vi.hoisted(() => ({
  status: "active",
  id: "11111111-1111-4111-8111-111111111111",
  fail: false,
  profiles: 1,
  rider: true,
  selected: "",
  membershipFailure: false,
  memberships: [] as { id: string; organisationId: string; domain: string; role: string }[],
}));
vi.mock("@/lib/env", () => ({
  NEXT_PUBLIC_SUPABASE_URL: "https://isolated.test",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
}));
vi.mock("@/lib/platform/client", () => ({
  platformFetch: async () => {
    if (state.membershipFailure) throw new Error("Workspace service unavailable");
    return { rider: state.rider, memberships: state.memberships };
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
    rpc: async () => ({ data: state.status === "active", error: state.fail ? { message: "offline" } : null }),
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
import { getAuthenticatedAppUser, getCurrentProductSession, getRiderProductSession, requireProductSession } from "@/lib/appUser";
beforeEach(() =>
  Object.assign(state, {
    status: "active",
    fail: false,
    profiles: 1,
    rider: true,
    selected: "",
    memberships: [],
    membershipFailure: false,
    id: "11111111-1111-4111-8111-111111111111",
  }),
);
it("allows an eligible rider and reads the canonical language preference", async () =>
  expect((await getAuthenticatedAppUser())?.appUser).toMatchObject({
    status: "active",
    languagePreference: "nl-NL",
  }));
it.each(["pending", "suspended", "blocked", "deleted", "inactive", "unknown", ""])(
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
it("keeps a User-only or Staff-only account authenticated without inventing a product role", async () => {
  state.rider = false; state.profiles = 0;
  const account = await getAuthenticatedAppUser();
  expect(account?.appUser.id).toBe(state.id);
  expect(account?.appUser).not.toHaveProperty("role");
  expect(await getCurrentProductSession()).toBeNull();
  await expect(requireProductSession()).rejects.toThrow("redirect:/workspaces");
});
it("does not make independent account authentication depend on organisation discovery", async () => {
  state.membershipFailure = true;
  expect((await getAuthenticatedAppUser())?.appUser.id).toBe(state.id);
  await expect(getCurrentProductSession()).rejects.toThrow("Workspace service unavailable");
});
it("opens a Rider-only session with zero organisation memberships", async () => {
  expect((await getCurrentProductSession())?.appUser.role).toBe("rider");
  expect((await getCurrentProductSession())?.riderProfile?.id).toBe("0");
});
it("requires explicit selection for a Rider with an independent organisation grant", async () => {
  state.memberships = [{ id: "membership", organisationId: "partner-org", domain: "partner", role: "viewer" }];
  await expect(getCurrentProductSession()).rejects.toThrow("redirect:/workspaces");
  state.selected = "rider";
  expect((await getCurrentProductSession())?.appUser.role).toBe("rider");
});
it("does not keep a revoked workspace or silently replace it with Rider access", async () => {
  state.selected = "revoked-org";
  await expect(getCurrentProductSession()).rejects.toThrow("redirect:/workspaces");
  expect((await getAuthenticatedAppUser())?.appUser.id).toBe(state.id);
});
