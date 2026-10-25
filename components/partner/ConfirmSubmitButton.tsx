"use client";

import { useEffect, useRef } from "react";
import { SubmitButton } from "@/components/form/SubmitButton";
import { Button } from "@/components/ui/button";
import { usePartnerOverlay } from "@/lib/usePartnerOverlay";

export function ConfirmSubmitButton({ title, description, cancelLabel, ...props }: React.ComponentProps<typeof SubmitButton> & { title: string; description: string; cancelLabel: string }) {
  const overlay = usePartnerOverlay();
  const dialog = useRef<HTMLDialogElement>(null), submitter = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (overlay.open && !dialog.current?.open) dialog.current?.showModal();
    if (!overlay.open && dialog.current?.open) { dialog.current.close(); submitter.current?.focus(); }
  }, [overlay.open]);
  return <><SubmitButton {...props} onClick={event => { event.preventDefault(); submitter.current = event.currentTarget; overlay.changeOpen(true); }} />
    <dialog ref={dialog} className="partner-menu partner-confirm" aria-label={title} onCancel={event => { event.preventDefault(); overlay.close(); }} onClick={event => { if (event.target === event.currentTarget) overlay.close(); }}><div className="partner-menu-panel space-y-5"><h2 className="text-xl">{title}</h2><p>{description}</p><div className="flex flex-wrap gap-3"><Button variant="outline" type="button" onClick={() => overlay.close()}>{cancelLabel}</Button><Button type="button" variant="destructive" onClick={() => overlay.close(() => { const button = submitter.current; if (button?.isConnected) button.form?.requestSubmit(button); })}>{props.children}</Button></div></div></dialog></>;
}
