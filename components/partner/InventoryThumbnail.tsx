"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

/** Decorative beside the visible inventory name; never invent a product image. */
export function PartnerCatalogImage({ src, banner = false, branded = false }: { src?: string | null; banner?: boolean; branded?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const safeSrc = src && /^https?:\/\//i.test(src) ? src : null;
  return (
    <span className={banner ? "flex aspect-[16/6] w-full shrink-0 items-center justify-center overflow-hidden bg-muted" : "flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted"} aria-hidden="true">
      {safeSrc && failedSrc !== safeSrc ? (
        // Provider images retain their original URL; no image proxy or host expansion.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={safeSrc} alt="" width={banner ? 1200 : 48} height={banner ? 450 : 48} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" ref={node => { if (node?.complete && node.naturalWidth === 0) setFailedSrc(safeSrc); }} onError={() => setFailedSrc(safeSrc)} />
      ) : branded ? <span className="partner-catalog-placeholder"><span className="partner-catalog-brand-mark" /><span>MOVRR</span></span> : <ImageIcon className={banner ? "size-8 text-muted-foreground" : "size-5 text-muted-foreground"} />}
    </span>
  );
}

export function InventoryThumbnail({ src }: { src?: string | null }) {
  return <PartnerCatalogImage src={src} />;
}
