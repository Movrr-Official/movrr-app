"use client";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { communityRideAction } from "@/app/actions/rider";
export function CommunityActionForm({
  children,
  className,
  accountId,
  operationId,
  create = false,
}: {
  children: React.ReactNode;
  className?: string;
  accountId?: string;
  operationId?: string;
  create?: boolean;
}) {
  const [state, action, pending] = useActionState(communityRideAction, null);
  const form = useRef<HTMLFormElement>(null),
    feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state?.error) feedback.current?.focus();
    if (state?.success && create && accountId) {
      sessionStorage.removeItem(`movrr-community-create:${accountId}`);
      form.current?.reset();
    }
  }, [state, create, accountId]);
  return (
    <form
      action={action}
      ref={form}
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        data.set("accountId", accountId ?? "");
        if (create && accountId) {
          const key = `movrr-community-create:${accountId}`;
          const operation = sessionStorage.getItem(key) ?? operationId ?? crypto.randomUUID();
          sessionStorage.setItem(key, operation);
          data.set("operationId", operation);
        }
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="accountId" value={accountId ?? ""}/>
      {create && <input type="hidden" name="operationId" value={operationId ?? ""}/>}
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state?.error && (
        <p
          ref={feedback}
          tabIndex={-1}
          role="alert"
          className="rounded border border-destructive p-3"
        >
          {state.error}
        </p>
      )}
      {state?.success && <p role="status">{state.message}</p>}
    </form>
  );
}
