export const PRODUCT_ROLES = ["rider", "advertiser", "partner", "government"] as const;
export type ProductRole = (typeof PRODUCT_ROLES)[number];

export const DASHBOARD_PATH_PREFIX = "/dashboard";
