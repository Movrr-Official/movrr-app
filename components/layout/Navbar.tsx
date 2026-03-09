"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AppSessionValue } from "@/providers/SessionProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function Navbar({
  session,
  onToggleSidebar,
}: {
  session: AppSessionValue;
  onToggleSidebar: () => void;
}) {
  const initials = session.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8"
    >
      <div className="flex flex-1 items-center gap-4 max-w-3xl">
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
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
          <div className="flex flex-col">
            <h2 className="text-lg uppercase font-semibold leading-none">
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
        <div className="hidden md:flex items-center">
          <Badge variant="outline" className="text-xs font-medium capitalize">
            {session.role} workspace
          </Badge>
        </div>

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

        <div className="hidden sm:flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">{session.name}</p>
            <p className="text-xs text-muted-foreground">{session.email}</p>
          </div>
          <Avatar>
            <AvatarImage
              src={session.avatarUrl ?? undefined}
              alt={session.name}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </motion.header>
  );
}
