"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

const subscribeThemeMount = () => () => {};

export function ThemeToggle({ locale = "en" }: { locale?: "en" | "nl" }) {
  const mounted = useSyncExternalStore(subscribeThemeMount, () => true, () => false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  const activeTheme = useMemo(
    () => (theme === "system" ? resolvedTheme : theme),
    [resolvedTheme, theme],
  );

  if (!mounted || !theme) {
    return <span className="inline-block size-9" aria-hidden="true" />;
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
      aria-label={locale === "nl" ? `Thema wijzigen, huidig thema: ${theme === "light" ? "licht" : theme === "dark" ? "donker" : "systeem"}` : `Toggle theme, current theme is ${theme ?? "system"}`}
      onClick={() => setTheme(nextTheme)}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
