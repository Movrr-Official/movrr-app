export default function UnauthorizedPage() {
  return (
    <main className="gradient-bg flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-lg rounded-2xl border border-border/60 p-10 text-center shadow-xl">
        <p className="text-primary text-sm font-semibold uppercase tracking-[0.24em]">MOVRR</p>
        <h1 className="mt-4 text-3xl font-semibold">Unauthorized</h1>
        <p className="text-muted-foreground mt-4 text-base">Your authenticated account does not have access to this product surface.</p>
      </div>
    </main>
  );
}
