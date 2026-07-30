/**
 * Rider Platform API wrappers — transport only.
 */

import { requireProductSession } from "@/lib/appUser";
import { platformFetch, createCorrelationId } from "@/lib/platform/client";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export type WalletBalance = {
  pointsBalance: number;
  lifetimePointsEarned: number;
};

export type WalletTransaction = {
  id: string;
  points: number;
  source?: string;
  description?: string;
  createdAt?: string;
};

export type RewardsCatalogItem = {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  pointsCost?: number;
  status?: string;
  fulfilmentType?: string;
  category?: string;
};

export type RedemptionDetail = {
  id: string;
  state?: string;
  progress?: string;
  catalogItemId?: string;
  pointsCost?: number;
  createdAt?: string;
  updatedAt?: string;
};

function mapWalletBalance(raw: unknown): WalletBalance {
  const row = asRecord(raw);
  return {
    pointsBalance: Number(row.pointsBalance ?? row.points_balance ?? 0),
    lifetimePointsEarned: Number(
      row.lifetimePointsEarned ?? row.lifetime_points_earned ?? 0,
    ),
  };
}

function mapWalletTransaction(raw: unknown): WalletTransaction {
  const row = asRecord(raw);
  return {
    id: String(row.id ?? ""),
    points: Number(row.points ?? row.points_earned ?? 0),
    source: typeof row.source === "string" ? row.source : undefined,
    description:
      typeof row.description === "string"
        ? row.description
        : typeof (row.metadata as Record<string, unknown> | undefined)
              ?.description === "string"
          ? String((row.metadata as Record<string, unknown>).description)
          : undefined,
    createdAt:
      typeof row.createdAt === "string"
        ? row.createdAt
        : typeof row.created_at === "string"
          ? row.created_at
          : undefined,
  };
}

function mapCatalogItem(raw: unknown): RewardsCatalogItem {
  const row = asRecord(raw);
  return {
    id: String(row.id ?? ""),
    title:
      typeof row.title === "string"
        ? row.title
        : typeof row.name === "string"
          ? row.name
          : undefined,
    name: typeof row.name === "string" ? row.name : undefined,
    description:
      typeof row.description === "string" ? row.description : undefined,
    pointsCost:
      typeof row.pointsCost === "number"
        ? row.pointsCost
        : typeof row.points_cost === "number"
          ? row.points_cost
          : undefined,
    status: typeof row.status === "string" ? row.status : undefined,
    fulfilmentType:
      typeof row.fulfilmentType === "string"
        ? row.fulfilmentType
        : typeof row.fulfilment_type === "string"
          ? row.fulfilment_type
          : undefined,
    category: typeof row.category === "string" ? row.category : undefined,
  };
}

function mapRedemption(raw: unknown): RedemptionDetail {
  const row = asRecord(raw);
  return {
    id: String(row.id ?? ""),
    state: typeof row.state === "string" ? row.state : undefined,
    progress: typeof row.progress === "string" ? row.progress : undefined,
    catalogItemId:
      typeof row.catalogItemId === "string"
        ? row.catalogItemId
        : typeof row.catalog_item_id === "string"
          ? row.catalog_item_id
          : undefined,
    pointsCost:
      typeof row.pointsCost === "number"
        ? row.pointsCost
        : typeof row.points_cost === "number"
          ? row.points_cost
          : undefined,
    createdAt:
      typeof row.createdAt === "string"
        ? row.createdAt
        : typeof row.created_at === "string"
          ? row.created_at
          : undefined,
    updatedAt:
      typeof row.updatedAt === "string"
        ? row.updatedAt
        : typeof row.updated_at === "string"
          ? row.updated_at
          : undefined,
  };
}

export async function getWalletBalance(): Promise<WalletBalance> {
  await requireProductSession(["rider"]);
  const data = await platformFetch<unknown>("/wallet/balance");
  return mapWalletBalance(data);
}

export async function listWalletTransactions(): Promise<WalletTransaction[]> {
  await requireProductSession(["rider"]);
  const data = await platformFetch<unknown[]>("/wallet/transactions");
  return (Array.isArray(data) ? data : [])
    .map(mapWalletTransaction)
    .filter((item) => item.id);
}

export async function listRewardsCatalog(): Promise<RewardsCatalogItem[]> {
  await requireProductSession(["rider"]);
  const data = await platformFetch<unknown[]>("/rewards/catalog");
  return (Array.isArray(data) ? data : [])
    .map(mapCatalogItem)
    .filter((item) => item.id);
}

export async function redeemReward(catalogItemId: string) {
  await requireProductSession(["rider"]);
  return platformFetch<unknown>("/rewards/redeem", {
    method: "POST",
    body: { catalogItemId },
    idempotencyKey: createCorrelationId(),
  });
}

export async function getRedemption(id: string): Promise<RedemptionDetail | null> {
  await requireProductSession(["rider"]);
  try {
    const data = await platformFetch<unknown>(`/rewards/redemptions/${id}`);
    const mapped = mapRedemption(data);
    return mapped.id ? mapped : null;
  } catch {
    return null;
  }
}
