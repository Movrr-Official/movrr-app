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

  return null;
}
