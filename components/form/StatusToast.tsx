"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function StatusToast({
  success,
  error,
}: {
  success?: string | null;
  error?: string | null;
}) {
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) feedback.current?.focus();
  }, [error]);
  const lastMessage = useRef<string | null>(null);

  useEffect(() => {
    if (success && lastMessage.current !== `success:${success}`) {
      toast.success(success);
      lastMessage.current = `success:${success}`;
    }
    if (error && lastMessage.current !== `error:${error}`) {
      toast.error(error);
      lastMessage.current = `error:${error}`;
    }
  }, [success, error]);

  return error ? (
    <p
      ref={feedback}
      id="form-feedback"
      tabIndex={-1}
      role="alert"
      className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm"
    >
      {error}
    </p>
  ) : success ? (
    <p role="status" className="text-sm">
      {success}
    </p>
  ) : null;
}
