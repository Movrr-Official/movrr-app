"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const key = "movrrPartnerOverlay";
const changed = "movrr-partner-overlay";

/** One same-URL history entry for transient UI, preserving Next's router state. */
export function usePartnerOverlay() {
  const id = useId();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const afterClose = useRef<(() => void) | undefined>(undefined);
  const previousPath = useRef(pathname);
  const close = useCallback((then?: () => void) => {
    setOpen(false);
    if (window.history.state?.[key] === id) {
      afterClose.current = then;
      window.history.back();
    } else then?.();
  }, [id]);
  const changeOpen = useCallback((next: boolean) => {
    if (!next) { close(); return; }
    const state = { ...window.history.state, [key]: id };
    if (window.history.state?.[key]) window.history.replaceState(state, "", window.location.href);
    else window.history.pushState(state, "", window.location.href);
    window.dispatchEvent(new Event(changed));
    setOpen(true);
  }, [id, close]);
  useEffect(() => {
    const sync = () => {
      // Forward never reopens an old overlay. There is no private UI state in history.
      if (window.history.state?.[key] === id) {
        const state = { ...window.history.state }; delete state[key];
        window.history.replaceState(state, "", window.location.href);
      }
      setOpen(false);
      const then = afterClose.current; afterClose.current = undefined;
      // Let the router finish restoring the traversed entry before starting a new route.
      if (then) window.setTimeout(then, 0);
    };
    const other = (event: Event) => {
      if ((event as CustomEvent).detail === "route") { sync(); return; }
      if (window.history.state?.[key] !== id) setOpen(false);
    };
    window.addEventListener("popstate", sync);
    window.addEventListener(changed, other);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener(changed, other);
      if (window.history.state?.[key] === id) {
        const state = { ...window.history.state }; delete state[key];
        window.history.replaceState(state, "", window.location.href);
      }
    };
  }, [id]);
  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      // Route changes already own navigation; never traverse history from this cleanup.
      window.dispatchEvent(new CustomEvent(changed, { detail: "route" }));
    }
  }, [pathname]);
  return { open, changeOpen, close };
}
