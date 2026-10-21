import { platformFetch } from "@/lib/platform/client";
import type { ProductRole } from "@/lib/constants";
export type AccountWorkspaces = { rider: boolean; memberships: { id: string; organisationId: string; name: string; domain: ProductRole; role: string; capabilities: string[] }[] };
export const getAccountWorkspaces = () => platformFetch<AccountWorkspaces>("/me/memberships");
