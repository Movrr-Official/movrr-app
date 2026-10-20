import { beforeEach, describe, expect, it, vi } from "vitest";
const { fetcher, guard } = vi.hoisted(() => ({ fetcher: vi.fn(), guard: vi.fn() }));
vi.mock("@/lib/appUser", () => ({ requireProductSession: guard }));
vi.mock("@/lib/platform/client", () => ({
  platformFetch: fetcher,
  createCorrelationId: () => "operation",
}));
import {
  getWalletBalance,
  listWalletTransactions,
  getWalletStatement,
  getRedemption,
  getRewardCredential,
} from "@/lib/platform/riderPlatform";
import { listRiderCampaigns } from "@/lib/platform/campaignPlatform";
import { listCommunityRides } from "@/lib/platform/communityPlatform";
import { communityInstant, localCommunityTime } from "@/lib/communitySchedule";
import { normalizedRiderLocale } from "@/lib/locale";
import { PlatformApiError } from "@/lib/platform/types";
const rider = "11111111-1111-4111-8111-111111111111",
  entry = "22222222-2222-4222-8222-222222222222",
  asOf = "2026-10-19T12:00:00.000Z";
const balance = {
  riderId: rider,
  pointsBalance: 70,
  lifetimePointsEarned: 120,
  transactionCount: 1,
  asOf,
};
const debit = {
  id: entry,
  riderId: rider,
  points: -50,
  source: "adjustment",
  category: "redemption",
  description: "Reward redeemed",
  createdAt: asOf,
};
beforeEach(() => {
  fetcher.mockReset();
  guard.mockReset().mockResolvedValue({ appUser: { id: rider, role: "rider" }, riderProfile: { id: rider } });
});
describe("Wallet canonical consumer", () => {
  it("reads the authoritative balance without aliases or fabricated values", async () => {
    fetcher.mockResolvedValue(balance);
    expect(await getWalletBalance()).toEqual(balance);
  });
  it("rejects an obsolete response shape", async () => {
    fetcher.mockResolvedValue({ balance: 70 });
    await expect(getWalletBalance()).rejects.toThrow();
  });
  it("preserves signed debits and follows every page", async () => {
    fetcher
      .mockResolvedValueOnce({ entries: [debit], nextCursor: "page2", asOf })
      .mockResolvedValueOnce({
        entries: [{ ...debit, id: rider, points: 50, category: "refund" }],
        nextCursor: null,
        asOf,
      });
    expect((await listWalletTransactions(asOf)).map((e) => e.points)).toEqual([-50, 50]);
    expect(fetcher.mock.calls[1][0]).toContain("cursor=page2");
  });
  it("rejects repeated cursors rather than truncating a statement", async () => {
    fetcher.mockResolvedValue({ entries: [], nextCursor: "repeat", asOf });
    await expect(listWalletTransactions(asOf)).rejects.toThrow("pagination");
  });
  it("does not replace an unavailable statement with database fallbacks", async () => {
    fetcher.mockRejectedValue(new Error("offline"));
    await expect(getWalletStatement()).rejects.toThrow("offline");
  });
  it("reads one backend-prepared coherent statement without serial API hops", async () => {
    fetcher.mockResolvedValue({ balance: { ...balance, transactionCount: 2, pointsBalance: 80 }, entries: [debit, { ...debit, id: rider, points: 10, category: "route" }] });
    const result = await getWalletStatement();
    expect(result.balance.pointsBalance).toBe(80);
    expect(result.entries).toHaveLength(2);
    expect(fetcher).toHaveBeenCalledExactlyOnceWith("/wallet/statement");
  });
  it("fails rather than mixing accounts", async () => {
    fetcher.mockResolvedValue({balance:{...balance,riderId:entry},entries:[debit]});
    await expect(getWalletStatement()).rejects.toThrow("Account changed");
  });
  it("rejects a mixed-owner ledger page even when counts match", async () => {
    fetcher.mockResolvedValue({balance,entries:[{...debit,riderId:entry}]});
    await expect(getWalletStatement()).rejects.toThrow("Account changed");
  });
  it("rejects incomplete backend statements", async () => {
    fetcher.mockResolvedValue({balance,entries:[]});
    await expect(getWalletStatement()).rejects.toThrow("incomplete");
  });
  it("rejects a changed statement cutoff", async () => {
    fetcher.mockResolvedValue({
      entries: [debit],
      nextCursor: null,
      asOf: "2026-10-20T00:00:00.000Z",
    });
    await expect(listWalletTransactions(asOf)).rejects.toThrow("snapshot changed");
  });
  it("stops before transport when authorization fails", async () => {
    guard.mockRejectedValue(new Error("restricted"));
    await expect(getWalletBalance()).rejects.toThrow("restricted");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
describe("shared rider contracts", () => {
  it("uses explicit canonical participation state", async () => {
    fetcher.mockResolvedValue([
      {
        id: entry,
        name: "Campaign",
        description: null,
        lifecycleStatus: "confirmed",
        campaignType: "swarm",
        startDate: null,
        endDate: null,
        targetZones: [],
        signupStatus: "selected",
        canJoin: false,
        canWithdraw: false,
        canConfirm: true,
      },
    ]);
    expect((await listRiderCampaigns())[0]).toMatchObject({
      signupStatus: "selected",
      canConfirm: true,
    });
  });
  it("retains canonical community meeting place and membership", async () => {
    fetcher.mockResolvedValue([
      {
        id: entry,
        title: "Ride",
        description: null,
        scheduled_at: asOf,
        meeting_point_name: "Station",
        category: "social",
        max_participants: 20,
        status: "upcoming",
        updated_at: asOf,
        isOrganizer: false,
        isJoined: true,
      },
    ]);
    expect((await listCommunityRides())[0]).toMatchObject({
      meeting_point_name: "Station",
      isJoined: true,
    });
  });
  it("distinguishes missing orders from an outage", async () => {
    fetcher.mockRejectedValue(
      new PlatformApiError({ kind: "infra", message: "offline", status: 503 }),
    );
    await expect(getRedemption(entry)).rejects.toThrow("offline");
    fetcher.mockRejectedValue(
      new PlatformApiError({ kind: "not_found", message: "missing", status: 404 }),
    );
    expect(await getRedemption(entry)).toBeNull();
  });
  it("retrieves the actual owner credential through the existing authority", async () => {
    fetcher.mockResolvedValue({
      fulfilmentId: entry,
      tokenType: "qr",
      status: "active",
      displayHint: "actual-issued-fixture-token",
      expiresAt: null,
    });
    expect((await getRewardCredential(entry)).displayHint).toBe(
      "actual-issued-fixture-token",
    );
    expect(fetcher).toHaveBeenCalledWith(`/fulfilment/${entry}/token`);
  });
});
describe("timezone and locale", () => {
  it("preserves summer and winter Amsterdam instants", () => {
    expect(communityInstant("2026-07-01T09:00", "Europe/Amsterdam")).toBe(
      "2026-07-01T07:00:00.000Z",
    );
    expect(communityInstant("2026-12-01T09:00", "Europe/Amsterdam")).toBe(
      "2026-12-01T08:00:00.000Z",
    );
  });
  it("rejects the DST gap", () =>
    expect(() => communityInstant("2026-03-29T02:30", "Europe/Amsterdam")).toThrow(
      "does not exist",
    ));
  it("requires an explicit choice for repeated local times", () => {
    expect(() => communityInstant("2026-10-25T02:30", "Europe/Amsterdam")).toThrow(
      "occurs twice",
    );
    expect(communityInstant("2026-10-25T02:30", "Europe/Amsterdam", "first")).toBe(
      "2026-10-25T00:30:00.000Z",
    );
    expect(communityInstant("2026-10-25T02:30", "Europe/Amsterdam", "second")).toBe(
      "2026-10-25T01:30:00.000Z",
    );
  });
  it("roundtrips displayed local schedule without server-zone dependence", () =>
    expect(localCommunityTime("2026-10-19T07:00:00Z")).toBe("2026-10-19T09:00"));
  it.each(["de", "fr", "en", "invalid"])(
    "rejects unsupported or obsolete account locale %s",
    (locale) => expect(() => normalizedRiderLocale(locale)).toThrow(),
  );
  it.each(["en-US", "nl-NL"])("uses canonical supported account locale %s", (locale) =>
    expect(normalizedRiderLocale(locale)).toBe(locale),
  );
});

it("preserves a historical redemption without a current catalog or fulfillment pointer",async()=>{fetcher.mockResolvedValue({id:entry,catalogItemId:"",fulfilmentId:"",pointsSpent:25,redemptionStatus:"fulfilled",createdAt:asOf,isFree:false,rewardTitle:"Historical reward"});expect(await getRedemption(entry)).toMatchObject({pointsSpent:25,rewardTitle:"Historical reward"})});
