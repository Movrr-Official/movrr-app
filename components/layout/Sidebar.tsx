"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  LineChart,
  LogOut,
  MapPinned,
  Megaphone,
  Package,
  QrCode,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import type { ProductRole } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const movrrEase = [0.22, 1, 0.36, 1] as const;

const navigation = {
  rider: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
    { href: "/dashboard/routes", label: "Routes", icon: MapPinned },
    { href: "/dashboard/rewards", label: "Rewards", icon: Trophy },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  advertiser: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
    { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
    { href: "/dashboard/billing", label: "Billing", icon: CircleDollarSign },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  partner: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/collections", label: "Collections", icon: ClipboardList },
    { href: "/dashboard/validate", label: "Validate", icon: QrCode },
    { href: "/dashboard/resources", label: "Resources", icon: Package },
    { href: "/dashboard/rewards", label: "Rewards", icon: Trophy },
    { href: "/dashboard/staff", label: "Staff", icon: Users },
    { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
} as const;

export function Sidebar({
  role,
  pathname,
  sidebarOpen,
  onToggle,
  onCloseMobile,
}: {
  role: ProductRole;
  pathname: string;
  sidebarOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const items = useMemo(() => navigation[role], [role]);
  const sidebarWidth = sidebarOpen ? 256 : 80;

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && isMobile ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: movrrEase }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: sidebarWidth,
          x: isMobile && !sidebarOpen ? -sidebarWidth : 0,
        }}
        transition={{ duration: 0.3, ease: movrrEase }}
        className={cn(
          "flex h-full flex-col border-r border-border bg-background z-50",
          isMobile ? "fixed" : "relative",
          "shadow-sm lg:shadow-none",
        )}
        aria-label="Main navigation"
      >
        <div
          className={cn(
            "h-16 flex items-center p-4 border-b border-border",
            sidebarOpen ? "justify-between" : "justify-center",
          )}
        >
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: movrrEase }}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <div className="w-8 h-8 bg-movrr-bg-primary rounded-[10px] flex items-center justify-center shrink-0">
                  <Image
                    src="/movrr-icon-mark.png"
                    alt="Movrr Icon"
                    width={24}
                    height={24}
                    sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 100vw"
                    quality={100}
                    priority
                    aria-hidden="true"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <h2 className="text-sm font-semibold tracking-[-0.03em] truncate">
                    Movrr
                  </h2>
                  <span className="text-xs text-muted-foreground truncate">
                    {role === "rider"
                      ? "Rider Workspace"
                      : role === "partner"
                        ? "Partner Workspace"
                        : "Advertiser Workspace"}
                  </span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="hover:bg-muted hover:text-foreground p-1"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <nav className="space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    !sidebarOpen && "justify-center",
                  )}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    if (isMobile) onCloseMobile();
                  }}
                >
                  <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <AnimatePresence mode="wait">
                    {sidebarOpen ? (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2, ease: movrrEase }}
                        className="flex items-center justify-between flex-1 min-w-0"
                      >
                        <span className="truncate">{item.label}</span>
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex h-16 shrink-0 items-center border-t border-border px-3">
          <form action="/api/auth/signout" method="post" className="w-full">
            <Button
              type="submit"
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer",
                !sidebarOpen && "justify-center",
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              <AnimatePresence mode="wait">
                {sidebarOpen ? (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, ease: movrrEase }}
                  >
                    Sign Out
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </Button>
          </form>
        </div>
      </motion.aside>
    </>
  );
}
