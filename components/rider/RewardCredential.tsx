"use client";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { revealRewardCredential } from "@/app/actions/rewardCredential";
import { Button } from "@/components/ui/button";
export function RewardCredential({
  fulfilmentId,
  accountId,
}: {
  fulfilmentId: string;
  accountId: string;
}) {
  const [state, action, pending] = useActionState(revealRewardCredential, null);
  const [expiredCredential, setExpiredCredential] = useState<unknown>(null);
  const expired = state !== null && expiredCredential === state;
  useEffect(() => {
    if (!state?.credential?.expiresAt) return;
    const expiresAt = Date.parse(state.credential.expiresAt);
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      timer = setTimeout(() => {
        if (Date.now() >= expiresAt) setExpiredCredential(state);
        else check();
      }, Math.max(0, Math.min(expiresAt - Date.now(), 2147483647)));
    };
    check();
    return () => clearTimeout(timer);
  }, [state]);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="fulfilmentId" value={fulfilmentId} />
      <p className="text-sm text-muted-foreground">
        Opening a digital reward confirms delivery. Keep your reward code private.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Opening reward..." : "Open reward"}
      </Button>
      <div aria-live="polite">
        {state?.error && <p role="alert">{state.error}</p>}
        {state?.credential &&
          state.accountId === accountId &&
          state.fulfilmentId === fulfilmentId &&
          !expired && (
            <div>
              <p className="text-sm">
                {state.credential.tokenType === "qr"
                  ? "Present this token to the partner"
                  : "Partner voucher code"}
              </p>
              {state.credential.qrDataUrl && (
                <Image
                  src={state.credential.qrDataUrl}
                  width={256}
                  height={256}
                  unoptimized
                  alt="Your single-use reward QR code"
                />
              )}
              <code className="block break-all rounded-xl border p-4 select-all">
                {state.credential.displayHint}
              </code>
            </div>
          )}
        {expired && <p>Reward expired. Refresh its status.</p>}
      </div>
    </form>
  );
}
