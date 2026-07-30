"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import type { AppSessionValue } from "@/providers/SessionProvider";

export function PageShell({
  session,
  children,
}: {
  session: AppSessionValue;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("movrr-product-sidebar-open");
    if (stored !== null) {
      setSidebarOpen(JSON.parse(stored) as boolean);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "movrr-product-sidebar-open",
      JSON.stringify(sidebarOpen),
    );
  }, [sidebarOpen]);

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
