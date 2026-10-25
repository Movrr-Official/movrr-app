"use client";
import { useActionState, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { Camera, Copy, ScanLine, Smartphone } from "lucide-react";
import { validateTokenAction } from "@/app/actions/partner";
import { voucherCopy, type VoucherValidationState } from "@/lib/partnerVoucher";
import { useOnline } from "@/lib/useOnline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// A small desktop window is still a desktop: use the primary input capabilities too.
const PHONE_QUERY = "(max-width: 1023px) and (pointer: coarse) and (hover: none)";
function subscribeToDevice(change: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}

export function ValidateTokenForm({ canValidate, initialLocale = "en", handoffUrl, handoffQr }: {
  canValidate: boolean; initialLocale?: "en" | "nl"; handoffUrl: string; handoffQr: string;
}) {
  const locale = initialLocale;
  const copy = voucherCopy[locale];
  const [linkStatus, setLinkStatus] = useState<"copied" | "copyFailed" | null>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  async function copyLink() {
    try { await navigator.clipboard.writeText(handoffUrl); setLinkStatus("copied"); }
    catch { linkInput.current?.focus(); linkInput.current?.select(); setLinkStatus("copyFailed"); }
  }
  const [token, setToken] = useState("");
  const [operation, setOperation] = useState("");
  const [scanning, setScanning] = useState(false);
  const subscribe = useCallback((change: () => void) => subscribeToDevice(() => { setScanning(false); change(); }), []);
  const mobile = useSyncExternalStore(subscribe, () => window.matchMedia(PHONE_QUERY).matches, () => null);
  const [cameraError, setCameraError] = useState(false);
  const [state, action, pending] = useActionState<VoucherValidationState, FormData>(validateTokenAction, {});
  const video = useRef<HTMLVideoElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const online = useOnline();
  const accepted = state.outcome === "validated";
  const setCode = useCallback((value: string) => {
    setToken(value);
    // Retry the same captured code with the same identity, even after a lost response.
    setOperation(crypto.randomUUID());
  }, []);
  useEffect(() => { if (state.outcome) feedback.current?.focus(); }, [state]);
  useEffect(() => {
    if (!mobile || !scanning || !online || !canValidate || pending || accepted) return;
    let disposed = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const release = () => { stream?.getTracks().forEach(track => track.stop()); };
    const stop = () => { release(); setScanning(false); };
    const hidden = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("offline", stop);
    (async () => {
      try {
        const { default: decode } = await import("jsqr");
        if (disposed) return;
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (disposed) { release(); return; }
        const preview = video.current;
        if (!preview) { stop(); return; }
        preview.srcObject = stream;
        await preview.play();
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Camera preview unavailable");
        const scan = () => {
          if (disposed) return;
          try {
            if (preview.readyState >= 2 && preview.videoWidth > 0) {
              canvas.width = Math.min(preview.videoWidth, 800);
              canvas.height = Math.round(canvas.width * preview.videoHeight / preview.videoWidth);
              context.drawImage(preview, 0, 0, canvas.width, canvas.height);
              const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
              const result = decode(pixels.data, pixels.width, pixels.height);
              if (result?.data) { setCode(result.data.trim()); stop(); return; }
            }
            timer = setTimeout(scan, 250);
          } catch { setCameraError(true); stop(); }
        };
        scan();
      } catch {
        release();
        if (!disposed) { setCameraError(true); setScanning(false); }
      }
    })();
    return () => { disposed = true; if (timer) clearTimeout(timer); release(); document.removeEventListener("visibilitychange", hidden); window.removeEventListener("offline", stop); };
  }, [mobile, scanning, online, canValidate, pending, accepted, setCode]);

  return <Card lang={locale} className="mx-auto w-full max-w-2xl overflow-hidden border-border">
    <CardHeader><div className="flex items-start justify-between gap-4">
      <div className="space-y-2"><CardTitle>{mobile === false ? copy.phoneTitle : copy.title}</CardTitle><CardDescription>{mobile === false ? copy.phoneDescription : copy.description}</CardDescription></div>

    </div></CardHeader>
    <CardContent className="space-y-5" lang={locale}>
      {!canValidate ? <p role="status">{copy.restricted}</p> : mobile === null ? <p role="status">{copy.preparing}</p> : !mobile ? <div className="space-y-6">
        <div className="grid items-center gap-6 sm:grid-cols-[240px_1fr]">
          <div className="mx-auto rounded-2xl border border-border bg-white p-3">
            <Image src={handoffQr} alt={copy.phoneQr} width={216} height={216} unoptimized />
          </div>
          <div className="space-y-5">
            <Smartphone className="size-9 text-primary" aria-hidden="true" />
            <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>{copy.phoneStep1}</li><li>{copy.phoneStep2}</li><li>{copy.phoneStep3}</li>
            </ol>
          </div>
        </div>
        <div className="space-y-2 border-t border-border pt-5">
          <label htmlFor="phone-scanner-link" className="text-sm font-medium">{copy.phoneLink}</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input ref={linkInput} id="phone-scanner-link" value={handoffUrl} readOnly onFocus={event => event.currentTarget.select()} className="min-w-0 text-sm" />
            <Button type="button" variant="outline" onClick={copyLink}><Copy className="mr-2 size-4" aria-hidden="true" />{copy.copyLink}</Button>
          </div>
          {linkStatus && <p role="status" className="text-sm text-muted-foreground">{copy[linkStatus]}</p>}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{copy.phonePrivacy}</p>
        <Button asChild variant="outline"><Link href="/dashboard/collections">{copy.viewCollections}</Link></Button>
      </div> : <>
        {!online && <p role="alert" className="rounded-xl border border-border bg-muted p-4">{copy.offline}</p>}
        {!accepted && <>
          <div className="partner-camera relative flex aspect-square max-h-96 items-center justify-center overflow-hidden rounded-2xl border border-border bg-movrr-bg-primary text-white">
            <video ref={video} muted playsInline aria-label={copy.scanning} className={scanning ? "h-full w-full object-cover" : "hidden"} />
            {!scanning && <div className="flex flex-col items-center gap-4 p-6 text-center"><ScanLine className="h-14 w-14 text-movrr-accent" aria-hidden="true" /><p className="text-sm text-white/75">{token ? copy.review : copy.scanning}</p></div>}
          </div>
          <Button type="button" variant={scanning ? "outline" : "default"} className="min-h-12 w-full" disabled={!online || pending} onClick={() => { setCameraError(false); setScanning(value => !value); }}><Camera className="mr-2 h-4 w-4" aria-hidden="true" />{scanning ? copy.stop : copy.start}</Button>
          {cameraError && <p role="alert" className="text-sm">{copy.cameraError}</p>}
          <form action={action} onSubmit={() => setScanning(false)} className="space-y-4">
            <input type="hidden" name="operationId" value={operation} />
            <details open={Boolean(token)}><summary className="cursor-pointer py-2 text-sm font-medium">{copy.manual}</summary>
              <label htmlFor="token" className="my-2 block text-sm">{copy.code}</label>
              <Input id="token" name="token" value={token} onChange={event => setCode(event.target.value)} autoComplete="off" spellCheck={false} minLength={32} maxLength={512} required disabled={pending} />
            </details>
            {token && <p role="status" className="text-sm text-muted-foreground">{copy.ready}</p>}
            {token && <Button className="min-h-12 w-full" disabled={!online || pending || !operation}>{pending ? copy.pending : copy.submit}</Button>}
          </form>
        </>}
        {state.outcome && <div ref={feedback} tabIndex={-1} role={accepted ? "status" : "alert"} className="space-y-4 rounded-xl border border-border bg-muted p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <p>{copy[state.outcome]}</p>
          {accepted && state.fulfilmentId && <Button asChild className="min-h-12 w-full"><Link href={`/dashboard/collections/${state.fulfilmentId}`}>{copy.next}</Link></Button>}
          <Button asChild variant="outline" className="min-h-12 w-full"><a href="/dashboard/validate">{copy.another}</a></Button>
        </div>}
      </>}
    </CardContent>
  </Card>;
}
