"use client";

import Image from "next/image";
import { Menu, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AppSessionValue } from "@/providers/SessionProvider";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar({
  session,
  onToggleSidebar,
}: {
  session: AppSessionValue;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-border bg-background">
      <div className="flex items-center gap-4 flex-1 max-w-3xl">
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-movrr-bg-primary rounded-[10px] flex items-center justify-center shrink-0">
            <Image
              src="/movrr-icon.png"
              alt="Movrr Icon"
              width={24}
              height={24}
              sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 100vw"
              quality={100}
              priority
              aria-hidden="true"
            />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold tracking-[-0.03em] leading-none">
              Movrr
            </h2>
            <span className="text-xs text-muted-foreground leading-none">
              {session.role === "rider"
                ? "Rider Workspace"
                : "Advertiser Workspace"}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center">
          <Breadcrumb />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 hover:bg-muted"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden sm:flex items-center gap-3 text-sm px-3 py-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="font-medium text-sm truncate max-w-40">
                {session.email}
              </span>
              <div className="scale-75 origin-left">
                <Badge
                  variant="outline"
                  className="capitalize text-[10px] font-medium"
                >
                  {session.role} workspace
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
