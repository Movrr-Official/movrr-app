import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  guard: vi.fn(),
  invoke: vi.fn(),
  set: vi.fn(),
  cookie: "",
  subject: "owner",
  passwordSubject: "owner",
}));
vi.mock("@/lib/appUser", () => ({ requireProductSession: state.guard }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (state.cookie ? { value: state.cookie } : undefined),
    set: state.set,
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("@/lib/env", () => ({
  NEXT_PUBLIC_SUPABASE_URL: "https://isolated.test",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ functions: { invoke: state.invoke } }),
}));
vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: state.subject } }, error: null }),
      signInWithPassword: async () => ({
        data: { user: { id: state.passwordSubject } },
        error: null,
      }),
    },
    functions: { invoke: state.invoke },
  }),
}));
import { requestAccountDeletion } from "@/app/actions/privacy";
import ReceiptPage from "@/app/account/deletion-receipt/page";
const requestId = "11111111-1111-4111-8111-111111111111",
  credential = "a".repeat(64);
const receipt = {
  contractVersion: 1,
  policyVersion: 1,
  requestId,
  status: "obligations_review",
};
beforeEach(() => {
  Object.assign(state, { cookie: "", subject: "owner", passwordSubject: "owner" });
  state.set.mockReset();
  state.invoke
    .mockReset()
    .mockResolvedValue({
      data: {
        ...receipt,
        receiptAccess: { credential, expiresAt: "2099-01-01T00:00:00Z" },
      },
      error: null,
    });
  state.guard
    .mockReset()
    .mockResolvedValue({
      appUser: { id: "owner" },
      authUser: { id: "owner", email: "owner@isolated.test" },
    });
});
const form = () => {
  const f = new FormData();
  f.set("acknowledgeDisclosure", "on");
  f.set("accountId", "owner");
  return f;
};
it("requests the canonical lifecycle and stores receipt credentials only in a protected cookie", async () => {
  await expect(requestAccountDeletion(form())).rejects.toThrow(
    "redirect:/account/deletion-receipt",
  );
  expect(state.invoke).toHaveBeenCalledWith("delete-account", {
    body: { policyVersion: 1, acknowledgeDisclosure: true },
  });
  expect(state.set).toHaveBeenCalledWith(
    "movrr-deletion-receipt",
    expect.stringContaining(credential),
    expect.objectContaining({ httpOnly: true, sameSite: "strict", path: "/" }),
  );
});
it("requires disclosure before any lifecycle request", async () => {
  await expect(requestAccountDeletion(new FormData())).rejects.toThrow(
    "redirect:/dashboard/settings/privacy?",
  );
  expect(state.invoke).not.toHaveBeenCalled();
});
it.each(["suspended", "deleted"])(
  "denies a %s session before requesting deletion",
  async () => {
    state.guard.mockRejectedValue(new Error("restricted"));
    await expect(requestAccountDeletion(form())).rejects.toThrow("restricted");
    expect(state.invoke).not.toHaveBeenCalled();
  },
);
it("denies account switching between page authorization and deletion", async () => {
  state.subject = "other";
  await expect(requestAccountDeletion(form())).rejects.toThrow(
    "redirect:/dashboard/settings/privacy?",
  );
  expect(state.invoke).not.toHaveBeenCalled();
});
it("denies password proof for another subject", async () => {
  state.passwordSubject = "other";
  const f = form();
  f.set("password", "fixture-password");
  await expect(requestAccountDeletion(f)).rejects.toThrow("redirect:/dashboard/settings/privacy?");
  expect(state.invoke).not.toHaveBeenCalled();
});
it("retains credential-only receipt access after the account is restricted without exposing the credential in HTML", async () => {
  state.guard.mockRejectedValue(new Error("restricted"));
  state.cookie = JSON.stringify({
    requestId,
    credential,
    expiresAt: "2099-01-01T00:00:00Z",
  });
  const html = renderToStaticMarkup(await ReceiptPage());
  expect(html).toContain("obligations review");
  expect(html).not.toContain(credential);
  expect(state.guard).not.toHaveBeenCalled();
  expect(state.invoke).toHaveBeenCalledWith(
    "delete-account",
    expect.objectContaining({ body: { operation: "receipt", requestId, credential } }),
  );
});
it("refuses expired receipt credentials before transport", async () => {
  state.cookie = JSON.stringify({
    requestId,
    credential,
    expiresAt: "2000-01-01T00:00:00Z",
  });
  const html = renderToStaticMarkup(await ReceiptPage());
  expect(html).toContain("expired");
  expect(state.invoke).not.toHaveBeenCalled();
});
it.each([0, 1])("checks receipt expiry at the request clock boundary (%i ms remaining)", async (remaining) => {
  const now = Date.parse("2026-10-27T10:00:00Z");
  const clock = vi.spyOn(Date, "now").mockReturnValue(now);
  try {
    state.cookie = JSON.stringify({ requestId, credential, expiresAt: new Date(now + remaining).toISOString() });
    const html = renderToStaticMarkup(await ReceiptPage());
    expect(html).not.toContain(credential);
    if (remaining === 0) {
      expect(html).toContain("expired");
      expect(state.invoke).not.toHaveBeenCalled();
    } else {
      expect(html).toContain("obligations review");
      expect(state.invoke).toHaveBeenCalledOnce();
    }
  } finally {
    clock.mockRestore();
  }
});
it("does not report completion when the authority is unavailable", async () => {
  state.cookie = JSON.stringify({ requestId, credential });
  state.invoke.mockResolvedValue({ data: null, error: { message: "offline" } });
  const html = renderToStaticMarkup(await ReceiptPage());
  expect(html).toContain("unavailable");
  expect(html).not.toContain("Status: completed");
});

it("rejects a stale deletion form from a previously signed-in account",async()=>{const f=form();f.set("accountId","previous-owner");await expect(requestAccountDeletion(f)).rejects.toThrow("redirect:/dashboard/settings/privacy?");expect(state.invoke).not.toHaveBeenCalled()});
