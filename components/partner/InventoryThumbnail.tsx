"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

/** Decorative beside the visible inventory name; never invent a product image. */
export function InventoryThumbnail({ src }: { src?: string | null }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const safeSrc = src && /^https?:\/\//i.test(src) ? src : null;
  return (
    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted" aria-hidden="true">
      {safeSrc && failedSrc !== safeSrc ? (
        // Provider images retain their original URL; no image proxy or host expansion.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={safeSrc} alt="" width={48} height={48} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" ref={node => { if (node?.complete && node.naturalWidth === 0) setFailedSrc(safeSrc); }} onError={() => setFailedSrc(safeSrc)} />
      ) : <ImageIcon className="size-5 text-muted-foreground" />}
    </span>
  );
}
