export const PRODUCT_ROLES = ["rider", "advertiser"] as const;
export type ProductRole = (typeof PRODUCT_ROLES)[number];

export const DASHBOARD_PATH_PREFIX = "/dashboard";
