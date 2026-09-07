"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import type { AppSessionValue } from "@/providers/SessionProvider";

const SIDEBAR_OPEN_STORAGE_KEY = "movrr-product-sidebar-open";
const SIDEBAR_PREFERENCE_EVENT = "movrr:sidebar-preference";

function getSidebarOpenSnapshot(): boolean {
  try {
    return (
      JSON.parse(
        window.localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY) ?? "false",
      ) === true
    );
  } catch {
    return false;
  }
}

function subscribeToSidebarPreference(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SIDEBAR_PREFERENCE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SIDEBAR_PREFERENCE_EVENT, onStoreChange);
  };
}

function persistSidebarOpen(value: boolean): void {
  window.localStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(SIDEBAR_PREFERENCE_EVENT));
}

export function PageShell({
  session,
  children,
}: {
  session: AppSessionValue;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const sidebarOpen = useSyncExternalStore(
    subscribeToSidebarPreference,
    getSidebarOpenSnapshot,
    () => false,
  );
  const toggleSidebar = () => persistSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen">
      <Sidebar
        role={session.role}
        pathname={pathname}
        sidebarOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onCloseMobile={() => persistSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 flex-col">
          <Navbar
            session={session}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={toggleSidebar}
          />
          <main className="flex-1 bg-background">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
