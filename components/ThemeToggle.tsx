"use client";

import { useMemo } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const activeTheme = useMemo(
    () => (theme === "system" ? resolvedTheme : theme),
    [resolvedTheme, theme],
  );

  if (!theme) {
    return null;
  }

  const nextTheme =
    theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const Icon =
    activeTheme === "dark" ? Moon : activeTheme === "light" ? Sun : Laptop;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-9 w-9 hover:bg-muted"
      aria-label={`Toggle theme, current theme is ${theme ?? "system"}`}
      onClick={() => setTheme(nextTheme)}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
