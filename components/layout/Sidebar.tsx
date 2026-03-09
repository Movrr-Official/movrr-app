"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  LineChart,
  LogOut,
  MapPinned,
  Megaphone,
  Settings,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductRole } from "@/lib/constants";
import { Button } from "@/components/ui/button";

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
            transition={{ duration: 0.2, ease: "easeInOut" }}
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
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "z-50 flex h-full flex-col bg-background shadow-sm lg:shadow-none",
          isMobile ? "fixed" : "relative",
        )}
        aria-label="Main navigation"
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-border p-4",
            sidebarOpen ? "justify-between" : "justify-center",
          )}
        >
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                  <Image
                    src="/movrr-icon.png"
                    alt="Movrr Icon"
                    width={24}
                    height={24}
                    priority
                    quality={100}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex min-w-0 flex-col">
                  <h2 className="truncate text-lg font-semibold uppercase">
                    Movrr
                  </h2>
                  <span className="truncate text-xs text-muted-foreground">
                    {role === "rider"
                      ? "Rider Workspace"
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
            className="p-1 hover:bg-muted hover:text-black"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        <nav className="flex-1 space-y-2 px-3 py-4">
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
                  "flex h-9 items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  !sidebarOpen && "justify-center",
                )}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  if (isMobile) onCloseMobile();
                }}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <AnimatePresence mode="wait">
                  {sidebarOpen ? (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Button
            asChild
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700",
              !sidebarOpen && "justify-center",
            )}
          >
            <Link href="/api/auth/signout">
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              <AnimatePresence mode="wait">
                {sidebarOpen ? (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    Sign Out
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </Link>
          </Button>
        </div>
      </motion.aside>
    </>
  );
}
