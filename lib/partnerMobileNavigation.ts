export const partnerMobileTabs = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/collections", label: "Activity" },
  { href: "/dashboard/validate", label: "Scan" },
  { href: "/dashboard/rewards", label: "Rewards" },
  { href: "/dashboard/more", label: "Account" },
] as const;
export function partnerMobileTab(pathname: string) {
  return partnerMobileTabs.find(tab => tab.href === "/dashboard" ? pathname === tab.href : pathname === tab.href || pathname.startsWith(tab.href + "/"))?.href ?? "/dashboard/more";
}
export function partnerMobileParent(pathname: string) {
  if (pathname.startsWith("/dashboard/rewards/")) return "/dashboard/rewards";
  if (pathname.startsWith("/dashboard/collections/")) return "/dashboard/collections";
  if (partnerMobileTab(pathname) === "/dashboard/more" && pathname !== "/dashboard/more") return "/dashboard/more";
  return null;
}
