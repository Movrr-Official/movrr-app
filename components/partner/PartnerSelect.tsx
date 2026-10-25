"use client";
import { Select } from "@/components/ui/select";
import { usePartnerOverlay } from "@/lib/usePartnerOverlay";

/** Same field primitive with Partner's transient Back-navigation contract. */
export function PartnerSelect(props: React.ComponentProps<typeof Select>) {
  const overlay = usePartnerOverlay();
  return <Select {...props} open={overlay.open} onOpenChange={overlay.changeOpen} />;
}
