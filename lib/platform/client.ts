/**
 * Server-side Platform API client — Bearer Supabase JWT to movrr-admin /api/v1.
 * No fulfilment business logic; transport + error mapping only.
 */

import { PLATFORM_API_URL } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  PlatformApiError,
  type PlatformErrorEnvelope,
  type PlatformSuccessEnvelope,
} from "@/lib/platform/types";

export type PlatformFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
  correlationId?: string;
  /** Injected for tests */
  accessToken?: string;
  /** Injected for tests */
  fetchImpl?: typeof fetch;
  /** Injected for tests — base ending with `/api` */
  baseUrl?: string;
};

function platformV1Base(adminApiUrl: string): string {
  const trimmed = adminApiUrl.replace(/\/$/, "");
  return `${trimmed}/v1`;
}

function createCorrelationId(): string {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {
    // fall through
  }
  return `corr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function resolveAccessToken(override?: string): Promise<string | null> {
  if (override !== undefined) {
    return override.trim() ? override : null;
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Authenticated fetch against Platform API `/api/v1`.
 * @param path - path under v1, e.g. `/partners/me`
 */
export async function platformFetch<T>(
  path: string,
  options: PlatformFetchOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    idempotencyKey,
    correlationId: incomingCorrelationId,
    accessToken: tokenOverride,
    fetchImpl = fetch,
    baseUrl = PLATFORM_API_URL,
  } = options;

  if (!baseUrl) {
    throw new PlatformApiError({
      kind: "infra",
      message: "PLATFORM_API_URL is not configured",
      status: 0,
    });
  }

  const token = await resolveAccessToken(tokenOverride);
  if (!token) {
    throw new PlatformApiError({
      kind: "unauthenticated",
      message: "Missing authorization token",
      status: 401,
    });
  }

  const correlationId = incomingCorrelationId ?? createCorrelationId();
  const normalisedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${platformV1Base(baseUrl)}${normalisedPath}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "X-Correlation-Id": correlationId,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    logger.warn("[PlatformAPI] Network failure", {
      path: normalisedPath,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new PlatformApiError({
      kind: "infra",
      message: "Network request failed",
      status: 0,
      correlationId,
    });
  }

  const responseCorrelation =
    response.headers.get("x-correlation-id") ?? correlationId;

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const errBody = json as PlatformErrorEnvelope | null;
    const kind = errBody?.error?.kind ?? "infra";
    const message =
      errBody?.error?.message ?? `Platform API error (${response.status})`;
    throw new PlatformApiError({
      kind,
      message,
      status: response.status,
      correlationId: errBody?.correlationId ?? responseCorrelation,
    });
  }

  const success = json as PlatformSuccessEnvelope<T> | null;
  if (!success || !("data" in success)) {
    throw new PlatformApiError({
      kind: "infra",
      message: "Malformed Platform API response",
      status: response.status,
      correlationId: responseCorrelation,
    });
  }

  return success.data;
}

export { platformV1Base, createCorrelationId };
