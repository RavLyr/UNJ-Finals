"use client";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section role="alert" aria-labelledby="dashboard-error-title" className="space-y-4 rounded-lg border p-6">
      <h1 id="dashboard-error-title" className="text-2xl font-bold">Dashboard gagal dimuat</h1>
      <p className="text-sm text-muted-foreground">Data belum dapat ditampilkan. Silakan coba lagi.</p>
      <button type="button" onClick={reset} className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        Coba lagi
      </button>
    </section>
  );
}
