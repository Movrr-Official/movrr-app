export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="flex h-16 shrink-0 items-center border-t border-border bg-background px-6">
      <div className="flex w-full flex-col items-center justify-between gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-2">
        <span>&copy; {currentYear} MOVRR</span>
        <span>Product workspace</span>
      </div>
    </footer>
  );
}
