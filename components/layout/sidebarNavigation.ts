export function isPathActive(pathname: string, href: string): boolean {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Returns only the most-specific matching destination. This prevents both a
 * parent item and a nested action (for example Campaigns and Create Campaign)
 * from being announced as the current page.
 */
export function resolveActiveNavigationHref(
  pathname: string,
  hrefs: readonly string[],
): string | null {
  return (
    hrefs
      .filter((href) => isPathActive(pathname, href))
      .sort((left, right) => right.length - left.length)[0] ?? null
  );
}
