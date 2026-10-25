/**
 * Partner catalog Platform API wrappers.
 */

import { requirePartnerSession } from "@/lib/appUser";
import { platformFetch, createCorrelationId } from "@/lib/platform/client";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export type PartnerCatalogInput = {
  title: string;
  description?: string;
  pointsCost: number;
  status?: "draft" | "active" | "paused" | "archived";
  sku?: string;
  category?: string;
  stockAvailable?: number;
};

export type PartnerCatalogItem = {
  thumbnailUrl?: string | null;
  imageUploadFailed?: boolean;
  updatedAt?: string;
  id: string;
  title?: string;
  description?: string;
  pointsCost?: number;
  status?: string;
  sku?: string;
  category?: string;
  stockAvailable?: number;
};

function mapCatalogItem(raw: unknown): PartnerCatalogItem {
  const row = asRecord(raw);
  return {
    id: String(row.id ?? ""),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : typeof row.updatedAt === "string" ? row.updatedAt : undefined,
    thumbnailUrl: typeof row.thumbnail_url === "string" ? row.thumbnail_url : typeof row.thumbnailUrl === "string" ? row.thumbnailUrl : null,
    imageUploadFailed: row.imageUploadFailed === true,
    title:
      typeof row.title === "string"
        ? row.title
        : typeof row.name === "string"
          ? row.name
          : undefined,
    description:
      typeof row.description === "string" ? row.description : undefined,
    pointsCost:
      typeof row.pointsCost === "number"
        ? row.pointsCost
        : typeof row.points_cost === "number"
          ? row.points_cost
          : undefined,
    status: typeof row.status === "string" ? row.status : undefined,
    sku: typeof row.sku === "string" ? row.sku : undefined,
    category: typeof row.category === "string" ? row.category : undefined,
    stockAvailable:
      typeof row.stockAvailable === "number"
        ? row.stockAvailable
        : typeof row.stock_available === "number"
          ? row.stock_available
          : undefined,
  };
}

function catalogBody(input: unknown, media?: FormData) {
  if (!media) return input;
  const form = new FormData();
  form.set("payload", JSON.stringify(input));
  const file = media.get("imageFile");
  if (file instanceof File && file.size > 0) form.set("imageFile", file);
  if (media.get("removeImage") === "true") form.set("removeImage", "true");
  return form;
}

export async function createPartnerCatalogItem(input: PartnerCatalogInput, media?: FormData) {
  await requirePartnerSession();
  const data = await platformFetch<unknown>("/partners/rewards", {
    method: "POST",
    body: catalogBody(input, media),
    idempotencyKey: createCorrelationId(),
  });
  return mapCatalogItem(data);
}

export async function updatePartnerCatalogItem(
  id: string,
  input: Partial<PartnerCatalogInput> & { expectedUpdatedAt: string },
  media?: FormData,
) {
  await requirePartnerSession();
  const data = await platformFetch<unknown>(`/partners/rewards/${id}`, {
    method: "PATCH",
    body: catalogBody(input, media),
    idempotencyKey: createCorrelationId(),
  });
  return mapCatalogItem(data);
}

export async function getPartnerCatalogItem(
  id: string,
): Promise<PartnerCatalogItem | null> {
  await requirePartnerSession();
  const { listPartnerRewards } = await import("@/services/partner");
  const items = await listPartnerRewards();
  const found = items.find((item) => item.id === id);
  if (!found) return null;
  return {
    id: found.id,
    updatedAt: found.updatedAt,
    thumbnailUrl: found.thumbnailUrl,
    description: found.description, category: found.category, sku: found.sku, stockAvailable: found.stockAvailable ?? undefined,
    title: found.name ?? undefined,
    pointsCost: found.pointsCost ?? undefined,
    status: found.status ?? undefined,
  };
}
