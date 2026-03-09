"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, House } from "lucide-react";

const LABELS: Record<string, string> = {
  rider: "Rider",
  advertiser: "Advertiser",
  campaigns: "Campaigns",
  routes: "Routes",
  rewards: "Rewards",
  notifications: "Notifications",
  profile: "Profile",
  analytics: "Analytics",
  billing: "Billing",
  settings: "Settings",
  create: "Create",
};

export function Breadcrumb() {
  const pathname = usePathname();

  const items = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    return segments.reduce<Array<{ href: string; label: string }>>((acc, segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      acc.push({
        href,
        label:
          LABELS[segment] ??
          segment
            .replace(/-/g, " ")
            .replace(/\b\w/g, (match) => match.toUpperCase()),
      });
      return acc;
    }, []);
  }, [pathname]);

  if (!items.length) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <Link
        href={items[0]?.href ?? "/"}
        className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
      >
        <House className="h-4 w-4" />
        <span>{items[0]?.label ?? "Home"}</span>
      </Link>
      {items.slice(1).map((item) => (
        <div key={item.href} className="inline-flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{item.label}</span>
        </div>
      ))}
    </nav>
  );
}
