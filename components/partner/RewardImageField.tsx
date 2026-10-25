"use client";

import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { partnerText, type PartnerLocale } from "@/lib/partnerLocale";

export function RewardImageField({ locale, initialUrl }: { locale: PartnerLocale; initialUrl?: string | null }) {
  const t = (text: string) => partnerText(locale, text);
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const { pending } = useFormStatus();
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const source = preview ?? (!removed ? initialUrl : null);

  return (
    <fieldset className="min-w-0 space-y-3 md:col-span-2" disabled={pending}>
      <legend className="partner-form-label mb-3">{t("Reward image")}</legend>
      <div className="relative flex aspect-[16/6] max-w-lg items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
        {source && source !== failed ? <Image src={source} alt={t("Reward image")} fill unoptimized sizes="(max-width: 640px) 100vw, 512px" className="object-cover" onError={() => setFailed(source)} /> : <ImagePlus className="size-9 text-muted-foreground" aria-hidden="true" />}
      </div>
      <p id={`${id}-help`} className="text-sm text-muted-foreground">{t("JPEG, PNG or WebP, up to 3 MB. A wide image works best.")}</p>
      <input ref={input} tabIndex={-1} id={id} name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={t("Reward image")} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`} aria-invalid={!!error} onChange={event => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.size || file.size > 3 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          event.target.value = "";
          setError(t("Choose a valid JPEG, PNG or WebP image up to 3 MB."));
          setPreview(null);
          return;
        }
        setError(null); setRemoved(false); setPreview(URL.createObjectURL(file));
      }} />
      <input type="hidden" name="removeImage" value={removed ? "true" : "false"} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={() => input.current?.click()}>{t(source ? "Replace image" : "Add image")}</Button>
        {source && <Button type="button" variant="ghost" disabled={pending} onClick={() => {
          if (input.current) input.current.value = "";
          setPreview(null); setRemoved(true); setError(null);
        }}>{t("Remove image")}</Button>}
      </div>
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
    </fieldset>
  );
}
