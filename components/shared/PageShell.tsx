"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import type { AppSessionValue } from "@/providers/SessionProvider";

const SIDEBAR_OPEN_STORAGE_KEY = "movrr-product-sidebar-open";

export function PageShell({
  session,
  children,
}: {
  session: AppSessionValue;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // Default collapsed for first visit; restored preference applied after hydrate.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPreferenceReady, setSidebarPreferenceReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY);
    if (stored !== null) {
      try {
        setSidebarOpen(JSON.parse(stored) === true);
      } catch {
        // Ignore corrupt values; keep default collapsed.
      }
    }
    setSidebarPreferenceReady(true);
  }, []);

  useEffect(() => {
    if (!sidebarPreferenceReady) return;
    window.localStorage.setItem(
      SIDEBAR_OPEN_STORAGE_KEY,
      JSON.stringify(sidebarOpen),
    );
  }, [sidebarOpen, sidebarPreferenceReady]);

  return (
    <div className="flex h-screen">
      <Sidebar
        role={session.role}
        pathname={pathname}
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((value: boolean) => !value)}
        onCloseMobile={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 flex-col">
          <Navbar
            session={session}
            onToggleSidebar={() => setSidebarOpen((value: boolean) => !value)}
          />
          <main className="flex-1 bg-background">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
