export default function NotFound() {
  return (
    <main className="gradient-bg flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-lg rounded-2xl border border-border/60 p-10 text-center shadow-xl">
        <p className="text-primary text-sm font-semibold uppercase tracking-[0.24em]">MOVRR</p>
        <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground mt-4 text-base">The requested product surface could not be found for this authenticated experience.</p>
      </div>
    </main>
  );
}
