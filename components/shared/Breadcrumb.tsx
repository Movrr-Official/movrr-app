"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

const routeLabels: Record<string, string> = {
  dashboard: "Overview",
  campaigns: "Campaigns",
  routes: "Routes",
  rewards: "Rewards",
  notifications: "Notifications",
  analytics: "Analytics",
  billing: "Billing",
  settings: "Settings",
};

const formatRouteLabel = (
  segment: string,
  params?: Record<string, string | string[]>,
): string => {
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      segment,
    );
  const isNumericID = /^\d+$/.test(segment);

  if (isUUID || isNumericID) {
    if (params) {
      const name = params.name || params.title || params.id;
      if (name && typeof name === "string") {
        return name.length > 30 ? `${name.substring(0, 30)}...` : name;
      }
    }
    return "Details";
  }

  if (routeLabels[segment]) {
    return routeLabels[segment];
  }

  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const generateBreadcrumbs = (
  pathname: string,
  params?: Record<string, string | string[]>,
): BreadcrumbItem[] => {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [
      {
        label: "Overview",
        href: "/dashboard",
        isActive: true,
      },
    ];
  }

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Home",
      href: "/dashboard",
      isActive: false,
    },
  ];

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    if (segment === "dashboard") {
      if (isLast) {
        breadcrumbs[0] = {
          label: "Overview",
          href: "/dashboard",
          isActive: true,
        };
      }
      return;
    }

    breadcrumbs.push({
      label: formatRouteLabel(segment, params),
      href: currentPath,
      isActive: isLast,
    });
  });

  return breadcrumbs;
};

export function Breadcrumb() {
  const pathname = usePathname();
  const params = useParams();
  const breadcrumbs = useMemo(
    () =>
      generateBreadcrumbs(
        pathname,
        params as Record<string, string | string[]>,
      ),
    [pathname, params],
  );

  if (pathname.startsWith("/auth") || pathname.startsWith("/unauthorized")) {
    return null;
  }

  const currentPageLabel =
    breadcrumbs.findLast((item) => item.isActive)?.label ?? "";

  return (
    <nav aria-label="Breadcrumb" className="flex flex-col gap-1">
      <ol className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        {breadcrumbs.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li
              key={`${item.href}-${index}`}
              className="flex items-center gap-1.5"
            >
              {isFirst ? (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-200",
                    item.isActive && "text-foreground",
                  )}
                  aria-label="Home"
                  title="Go to Overview"
                >
                  <Home className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              ) : (
                <>
                  <span className="text-muted-foreground/50">/</span>
                  {isLast ? (
                    <span
                      className={cn(
                        "text-muted-foreground font-medium",
                        "truncate max-w-50 sm:max-w-none",
                      )}
                      aria-current="page"
                    >
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium",
                        "truncate max-w-50 sm:max-w-none",
                      )}
                      title={`Go to ${item.label}`}
                    >
                      {item.label}
                    </Link>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>
      {currentPageLabel && (
        <span className="text-base font-semibold text-foreground leading-none">
          {currentPageLabel}
        </span>
      )}
    </nav>
  );
}
