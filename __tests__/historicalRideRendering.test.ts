import { beforeEach, expect, it, vi } from "vitest";
const { fetcher, guard } = vi.hoisted(() => ({ fetcher: vi.fn(), guard: vi.fn() }));
vi.mock("@/lib/appUser", () => ({ requireProductSession: guard }));
vi.mock("@/lib/platform/client", () => ({ platformFetch: fetcher }));
import { listRideSummaries, rideSummarySchema } from "@/lib/platform/riderSelfService";
const id = "11111111-1111-4111-8111-111111111111";
const summary = {
  contractVersion: 1, rideSessionId: id,
  session: { id, rider_id: id, status: "completed", started_at: "2026-10-20T10:00:00Z", verification_result: {} },
  settlement: { status: "unknown", reason_code: "historical_evidence_incomplete" },
  committedPoints: null, totalPoints: null, transactions: [],
};
beforeEach(() => { guard.mockReset().mockResolvedValue({}); fetcher.mockReset(); });
it("renders canonical historical evidence without inventing verification or points", async () => {
  fetcher.mockResolvedValue({ summaries: [summary], nextCursor: null });
  const page = await listRideSummaries();
  expect(page.summaries[0]).toEqual(summary);
  expect(page.summaries[0].session.verification_result?.status).toBeUndefined();
});
it("preserves real verification evidence and rejects malformed status types", () => {
  expect(rideSummarySchema.parse({ ...summary, session: { ...summary.session, verification_result: { status: "verified", score: 0.9 } } }).session.verification_result).toEqual({status: "verified", score: 0.9});
  expect(() => rideSummarySchema.parse({ ...summary, session: { ...summary.session, verification_result: { status: 123 } } })).toThrow();
});
it("keeps backend failures visible", async () => {
  fetcher.mockRejectedValue(new Error("backend unavailable"));
  await expect(listRideSummaries()).rejects.toThrow("backend unavailable");
});
it("authorizes before reading rides", async () => {
  guard.mockRejectedValue(new Error("restricted"));
  await expect(listRideSummaries()).rejects.toThrow("restricted");
  expect(fetcher).not.toHaveBeenCalled();
});
