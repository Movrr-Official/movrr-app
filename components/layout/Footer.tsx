import { partnerText } from "@/lib/partnerLocale";
export function Footer({ locale = "en" }: { locale?: "en" | "nl" }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="flex h-16 shrink-0 items-center border-t border-border bg-background px-6">
      <div className="flex w-full flex-col items-center justify-between gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-2">
        <span>&copy; {currentYear} MOVRR</span>
        <span>{partnerText(locale, "Product workspace")}</span>
      </div>
    </footer>
  );
}
