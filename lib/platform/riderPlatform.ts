import { z } from "zod";
import { requireProductSession } from "@/lib/appUser";
import { platformFetch } from "@/lib/platform/client";
import { PlatformApiError } from "@/lib/platform/types";
export const walletBalanceSchema = z.object({
  riderId: z.string().uuid(),
  pointsBalance: z.number().int(),
  lifetimePointsEarned: z.number().int().nonnegative(),
  transactionCount: z.number().int().nonnegative(),
  asOf: z.string().datetime({ offset: true }),
});
export const walletTransactionSchema = z.object({
  id: z.string().uuid(),
  riderId: z.string().uuid(),
  points: z.number().int(),
  source: z.string(),
  category: z.enum(["campaign", "route", "adjustment", "redemption", "refund", "other"]),
  description: z.string(),
  createdAt: z.string().datetime({ offset: true }),
});
const walletPageSchema = z.object({
  entries: z.array(walletTransactionSchema),
  nextCursor: z.string().nullable(),
  asOf: z.string().datetime({ offset: true }),
});
export type WalletBalance = z.infer<typeof walletBalanceSchema>;
export type WalletTransaction = z.infer<typeof walletTransactionSchema>;
export async function getWalletBalance(): Promise<WalletBalance> {
  await requireProductSession(["rider"]);
  return walletBalanceSchema.parse(await platformFetch("/wallet/balance"));
}
export async function listWalletTransactions(asOf: string): Promise<WalletTransaction[]> {
  await requireProductSession(["rider"]);
  const entries: WalletTransaction[] = [];
  const seen = new Set<string>();
  let cursor: string | null = null;
  do {
    const page = walletPageSchema.parse(
      await platformFetch(
        "/wallet/transactions?" +
          new URLSearchParams({ asOf, ...(cursor ? { cursor } : {}) }),
      ),
    );
    if (page.asOf !== asOf) throw new Error("Wallet statement snapshot changed");
    entries.push(...page.entries);
    cursor = page.nextCursor;
    if (cursor && seen.has(cursor)) throw new Error("Invalid Wallet pagination");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return entries;
}
/** Backend owns snapshot preparation and bounded concurrent-append retries. */
export async function getWalletStatement() {
  const session = await requireProductSession(["rider"]);
  const statement = z.object({
    balance: walletBalanceSchema,
    entries: z.array(walletTransactionSchema),
  }).parse(await platformFetch("/wallet/statement"));
  if (statement.balance.riderId !== session.riderProfile?.id || statement.entries.some(entry => entry.riderId !== statement.balance.riderId))
    throw new Error("Account changed during Wallet read");
  if (statement.entries.length !== statement.balance.transactionCount)
    throw new Error("Wallet statement incomplete");
  return statement;
}
const redemptionSchema = z.object({
  id: z.string().uuid(),
  catalogItemId: z.string(),
  pointsSpent: z.number().int().nonnegative(),
  redemptionStatus: z.string(),
  fulfilmentId: z.string(),
  rewardTitle: z.string().nullable().optional(),
  createdAt: z.string().datetime({ offset: true }),
  isFree: z.boolean(),
});
export async function listRedemptions() {
  await requireProductSession(["rider"]);
  return z.array(redemptionSchema).parse(await platformFetch("/rewards/redemptions"));
}
export async function getRedemption(id: string) {
  await requireProductSession(["rider"]);
  z.string().uuid().parse(id);
  try {
    return redemptionSchema.parse(await platformFetch(`/rewards/redemptions/${id}`));
  } catch (error) {
    if (error instanceof PlatformApiError && error.status === 404) return null;
    throw error;
  }
}
export async function getFulfilment(id: string) {
  await requireProductSession(["rider"]);
  z.string().uuid().parse(id);
  return z
    .object({
      id: z.string().uuid(),
      state: z.string(),
      fulfilmentType: z.string(),
      outcome: z.string().nullable(),
      progress: z.string(),
      expiresAt: z.string().datetime({ offset: true }).nullable(),
    })
    .parse(await platformFetch(`/fulfilment/${id}`));
}
export async function getRewardCredential(id: string) {
  await requireProductSession(["rider"]);
  z.string().uuid().parse(id);
  return z
    .object({
      fulfilmentId: z.string().uuid(),
      tokenType: z.string(),
      status: z.literal("active"),
      displayHint: z.string().min(1),
      expiresAt: z.string().datetime({ offset: true }).nullable(),
    })
    .parse(await platformFetch(`/fulfilment/${id}/token`));
}
