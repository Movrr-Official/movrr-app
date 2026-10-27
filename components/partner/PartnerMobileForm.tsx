"use client";
import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePartnerMobile } from "@/lib/usePartnerMobile";
import type { PartnerLocale } from "@/lib/partnerLocale";

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
const guardKey = "movrrPartnerEditor";
/** Progressive mobile editing only. The supplied form action and fields stay canonical. */
export function PartnerMobileForm({ locale, children, className, ...props }: ComponentProps<"form"> & { locale: PartnerLocale }) {
  const mobile = usePartnerMobile(), pathname = usePathname(), router = useRouter(), id = useId();
  const form = useRef<HTMLFormElement>(null), dialog = useRef<HTMLDialogElement>(null);
  const [dirty, setDirty] = useState(false), [invalid, setInvalid] = useState(false), [prompt, setPrompt] = useState(false);
  const decide = useRef<(leave: boolean) => void>(() => {});
  const nl = locale === "nl";
  useEffect(() => {
    if (!mobile || !form.current) return;
    const editor = form.current, url = window.location.href;
    let changed = false, awaitingSubmit = false, next: (() => void) | undefined, intent: (() => void) | undefined;
    const snapshot = () => JSON.stringify([...new FormData(editor)].map(([key, value]) => [key, typeof value === "string" ? value : value.name ? [value.name, value.size, value.lastModified] : null]));
    let initial = snapshot(); // Memory only; never persist editor values or voucher codes.
    const arm = () => { if (window.history.state?.[guardKey] !== id) window.history.pushState({ ...window.history.state, [guardKey]: id }, "", url); };
    const consume = (then: () => void) => {
      if (window.history.state?.[guardKey] === id) { next = then; window.history.back(); }
      else then();
    };
    const errors = new Map<Field, HTMLElement>();
    const originals = new Map<HTMLElement, Map<string, string | null>>();
    const attr = (field: HTMLElement, name: string, value: string | null) => {
      if (!originals.has(field)) originals.set(field, new Map());
      const saved = originals.get(field)!;
      if (!saved.has(name)) saved.set(name, field.getAttribute(name));
      if (value === null) field.removeAttribute(name); else field.setAttribute(name, value);
    };
    const fields = () => [...editor.querySelectorAll<Field>('input:not([type=hidden]):not([type=file]):not([type=checkbox]),textarea,select')].filter(field => !field.disabled && field.getAttribute("aria-hidden") !== "true");
    for (const [index, field] of fields().entries()) {
      if (field instanceof HTMLInputElement) { attr(field, "enterkeyhint", index === fields().length - 1 ? "done" : "next"); if (field.type === "number") attr(field, "inputmode", "numeric"); }
      if (field.name === "codes") { attr(field, "aria-label", nl ? "Vouchercodes" : "Voucher codes"); attr(field, "autocomplete", "off"); attr(field, "spellcheck", "false"); }
    }
    const clearError = (field: Field) => {
      errors.get(field)?.remove(); errors.delete(field);
      const trigger = field instanceof HTMLSelectElement ? field.closest("label")?.querySelector<HTMLButtonElement>('[role="combobox"]') : null;
      for (const node of [field, trigger]) if (node) for (const name of ["aria-invalid", "aria-describedby"]) {
        const value = originals.get(node)?.get(name);
        if (value === undefined) continue;
        if (value === null) node.removeAttribute(name); else node.setAttribute(name, value);
      }
      setInvalid(errors.size > 0);
    };
    const showError = (field: Field) => {
      let error = errors.get(field);
      if (!error) { error = document.createElement("span"); error.id = `${id}-error-${errors.size}-${field.name}`; error.className = "partner-field-error"; error.setAttribute("aria-hidden","true"); (field.closest("label") ?? field.parentElement)?.append(error); errors.set(field, error); } // Explicit aria-describedby reads this without adding the error to the field's label.
      error.textContent = field.validity.valueMissing ? (nl ? "Vul dit veld in." : "Complete this field.") : field.validity.rangeUnderflow ? (nl ? "Gebruik een waarde vanaf " : "Use a value of at least ") + (field as HTMLInputElement).min + "." : field.validity.stepMismatch ? (nl ? "Gebruik een heel getal." : "Use a whole number.") : (nl ? "Controleer de ingevulde waarde." : "Check the value you entered.");
      const saved = originals.get(field);
      const description = saved?.has("aria-describedby") ? saved.get("aria-describedby") : field.getAttribute("aria-describedby");
      attr(field, "aria-invalid", "true"); attr(field, "aria-describedby", [description, error.id].filter(Boolean).join(" "));
      const trigger = field instanceof HTMLSelectElement ? field.closest("label")?.querySelector<HTMLButtonElement>('[role="combobox"]') : null;
      if (trigger) { attr(trigger,"aria-invalid","true"); attr(trigger,"aria-describedby",error.id); }
      setInvalid(true);
    };
    const edit = (event?: Event) => {
      if (event?.target instanceof HTMLInputElement || event?.target instanceof HTMLTextAreaElement || event?.target instanceof HTMLSelectElement) {
        const field = event.target; if (errors.has(field)) { if (field.validity.valid) clearError(field); else showError(field); }
      }
      const value = snapshot() !== initial;
      if (value === changed) return;
      changed = value; setDirty(value);
      if (value) arm(); else consume(() => {});
    };
    const invalidField = (event: Event) => {
      const field = event.target as Field;
      event.preventDefault(); showError(field);
      requestAnimationFrame(() => { const first = editor.querySelector<Field>('[aria-invalid="true"]'); first?.focus(); });
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.isComposing || !(event.target instanceof HTMLInputElement) || ["checkbox", "file", "submit"].includes(event.target.type)) return;
      const all = fields(), index = all.indexOf(event.target), following = all[index + 1];
      if (following) { event.preventDefault(); following.focus(); }
    };
    const navigate = (event: MouseEvent) => {
      if (!changed || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element)?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const href = new URL(link.href, url);
      if (href.href === window.location.href || (href.pathname === window.location.pathname && href.search === window.location.search && href.hash)) return;
      event.preventDefault(); event.stopPropagation();
      intent = () => consume(() => { if (href.origin === window.location.origin) router.push(href.pathname + href.search + href.hash); else window.location.assign(href.href); });
      setPrompt(true);
    };
    const pop = () => {
      if (next) { const callback = next; next = undefined; window.setTimeout(callback, 0); return; }
      if (!changed || window.location.href !== url || window.history.state?.[guardKey] === id) return;
      arm();
      if (intent) { intent = undefined; setPrompt(false); return; } // Back dismisses the sheet first.
      intent = () => { if (window.history.length > 2) window.history.go(-2); else consume(() => router.push(pathname.startsWith("/dashboard/rewards") ? "/dashboard/rewards" : "/dashboard/more")); }; // Guard + original editor entry; safe parent for a direct launch.
      setPrompt(true);
    };
    decide.current = leave => {
      const navigation = intent; intent = undefined; setPrompt(false);
      if (leave && navigation) { changed = false; setDirty(false); navigation(); }
    };
    const unload = (event: BeforeUnloadEvent) => { if (changed) { event.preventDefault(); event.returnValue = ""; } };
    const submit = (event: SubmitEvent) => {
      if (awaitingSubmit) { event.preventDefault(); event.stopPropagation(); return; }
      if (!changed) return;
      changed = false; setDirty(false); initial = snapshot();
      if (window.history.state?.[guardKey] === id) {
        awaitingSubmit = true;
        event.preventDefault(); event.stopPropagation(); const submitter = event.submitter;
        consume(() => { awaitingSubmit = false; if (!editor.isConnected) return; if (submitter) editor.requestSubmit(submitter); else editor.requestSubmit(); }); // One original action, after removing the guard.
      }
    };
    const reset = () => { window.setTimeout(() => { changed = false; setDirty(false); errors.forEach((_,field) => clearError(field)); consume(() => {}); }, 0); };
    const observer = new MutationObserver(() => edit()); observer.observe(editor, { subtree:true, attributes:true, attributeFilter:["value"] });
    editor.addEventListener("input", edit); editor.addEventListener("change", edit); editor.addEventListener("invalid", invalidField, true); editor.addEventListener("keydown", keyboard); editor.addEventListener("submit", submit, true); editor.addEventListener("reset", reset);
    document.addEventListener("click", navigate, true); window.addEventListener("popstate", pop); window.addEventListener("beforeunload", unload);
    return () => {
      observer.disconnect(); editor.removeEventListener("input", edit); editor.removeEventListener("change", edit); editor.removeEventListener("invalid", invalidField, true); editor.removeEventListener("keydown", keyboard); editor.removeEventListener("submit", submit, true); editor.removeEventListener("reset", reset);
      document.removeEventListener("click", navigate, true); window.removeEventListener("popstate", pop); window.removeEventListener("beforeunload", unload);
      errors.forEach(error => error.remove()); originals.forEach((saved,field) => saved.forEach((value,name) => { if (value === null) field.removeAttribute(name); else field.setAttribute(name,value); }));
      if (window.history.state?.[guardKey] === id) { const state = { ...window.history.state }; delete state[guardKey]; window.history.replaceState(state,"",window.location.href); }
    };
  }, [mobile, locale, pathname, router, id, nl]);
  useEffect(() => { if (prompt) dialog.current?.showModal(); else dialog.current?.close(); }, [prompt]);
  return <><form {...props} ref={form} className={mobile ? `${className ?? ""} partner-mobile-form` : className}>
    {mobile && invalid && <p className="partner-form-error-summary" role="alert">{nl ? "Controleer de gemarkeerde velden." : "Check the highlighted fields."}</p>}
    {children}
    {mobile && dirty && <p className="partner-form-draft-note">{nl ? "Niet-opgeslagen wijzigingen" : "Unsaved changes"}</p>}
  </form>{mobile && <dialog ref={dialog} className="partner-leave-sheet" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={event => { event.preventDefault(); decide.current(false); }} onClick={event => { if (event.target === dialog.current) { const bounds = dialog.current.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) decide.current(false); } }}>
    <h2 id={`${id}-title`}>{nl ? "Wijzigingen behouden?" : "Keep your changes?"}</h2>
    <p id={`${id}-description`}>{nl ? "Je wijzigingen zijn nog niet opgeslagen. Blijf om verder te bewerken of verlaat deze pagina." : "Your changes have not been saved. Stay to keep editing, or leave this page."}</p>
    <button type="button" className="partner-leave-stay" onClick={() => decide.current(false)} autoFocus>{nl ? "Verder bewerken" : "Keep editing"}</button>
    <button type="button" onClick={() => decide.current(true)}>{nl ? "Wijzigingen verwerpen" : "Discard changes"}</button>
  </dialog>}</>;
}
