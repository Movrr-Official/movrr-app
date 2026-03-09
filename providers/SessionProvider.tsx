"use client";

import { createContext, useContext } from "react";
import type { ProductRole } from "@/lib/constants";

export type AppSessionValue = {
  authUserId: string;
  role: ProductRole;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

const AppSessionContext = createContext<AppSessionValue | null>(null);

export function AppSessionProvider({ value, children }: { value: AppSessionValue; children: React.ReactNode }) {
  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(AppSessionContext);
  if (!context) {
    throw new Error("useAppSession must be used within AppSessionProvider");
  }
  return context;
}
