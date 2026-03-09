"use client";

import { Bell, FileText, LayoutDashboard, MapPinned, Megaphone, PlusCircle, Trophy, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const ICONS = {
  bell: Bell,
  dashboard: LayoutDashboard,
  file: FileText,
  megaphone: Megaphone,
  rewards: Trophy,
  routes: MapPinned,
} satisfies Record<string, LucideIcon>;

export type EmptyStateIconName = keyof typeof ICONS;

export function EmptyState({
  title = "No content available",
  description = "Get started by creating your first item",
  iconName = "file",
  buttonText = "Create New",
  navigateTo,
}: {
  title?: string;
  description?: string;
  iconName?: EmptyStateIconName;
  buttonText?: string;
  navigateTo?: string;
}) {
  const router = useRouter();
  const Icon = ICONS[iconName];

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground/60 dark:bg-muted/30">
        <Icon className="h-10 w-10" />
      </div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <p className="mb-4 max-w-md text-xs text-muted-foreground">{description}</p>
      {navigateTo ? (
        <Button size="sm" onClick={() => router.push(navigateTo)} className="mt-4">
          <PlusCircle className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      ) : null}
    </div>
  );
}
