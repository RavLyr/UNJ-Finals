"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult, Event } from "@/lib/types";
import { deleteEvent, setEventStatus } from "@/server/actions/events";

const labels = {
  published: "Publikasikan event",
  cancelled: "Batalkan event",
  completed: "Selesaikan event",
  delete: "Hapus event",
};

function LifecycleForm({ eventId, operation, preview }: {
  eventId: string;
  operation: keyof typeof labels;
  preview: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const handled = useRef<ActionResult<null> | null>(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [state, action, pending] = useActionState(
    operation === "delete" ? deleteEvent : setEventStatus, null,
  );
  const failure = state && !state.success ? state : null;
  const reasonError = failure?.fieldErrors?.cancellationReason;
  const needsConfirmation = operation === "completed" || operation === "delete";
  const destructive = operation === "cancelled" || operation === "delete";

  useEffect(() => {
    if (!state || handled.current === state) return;
    handled.current = state;
    if (!state.success) {
      const invalid = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      (invalid ?? form.current?.querySelector<HTMLElement>('[role="alert"]'))?.focus();
      return;
    }
    toast.success(operation === "delete" ? "Event berhasil dihapus." :
      operation === "published" ? "Event berhasil dipublikasikan." :
        operation === "cancelled" ? "Event berhasil dibatalkan." : "Event ditandai selesai.");
    if (operation === "delete") router.push("/dashboard");
    router.refresh();
  }, [state, operation, router]);

  return (
    <form ref={form} action={action} aria-busy={pending} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      {operation !== "delete" && <input type="hidden" name="status" value={operation} />}
      {failure && (
        <div role="alert" tabIndex={-1} className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 focus-visible:outline-2 focus-visible:outline-ring">
          <p>{failure.error}</p>
          {failure.fieldErrors && <ul className="mt-1 list-inside list-disc">
            {Object.entries(failure.fieldErrors).filter(([field]) => field !== "cancellationReason" || operation !== "cancelled").map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>}
        </div>
      )}
      <fieldset disabled={preview || pending || Boolean(state?.success)} className="space-y-3 disabled:opacity-60">
        {operation === "cancelled" && <div className="space-y-2">
          <label htmlFor={`${id}-reason`} className="block text-sm font-medium">Alasan pembatalan</label>
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">Alasan ditampilkan kepada peserta. Event yang dibatalkan tidak dapat dipublikasikan kembali.</p>
          <textarea id={`${id}-reason`} name="cancellationReason" required maxLength={1000} rows={3}
            value={reason} onChange={(e) => setReason(e.target.value)}
            aria-invalid={Boolean(reasonError)}
            aria-describedby={`${id}-hint${reasonError ? ` ${id}-reason-error` : ""}`}
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-red-700 disabled:cursor-not-allowed" />
          {reasonError && <p id={`${id}-reason-error`} className="text-sm text-red-700">{reasonError}</p>}
        </div>}
        {needsConfirmation && <>
          <p id={`${id}-confirmation-hint`} className="text-sm text-muted-foreground">
            {operation === "delete"
              ? "Event dihapus dari dashboard dan halaman publik. Data peserta dan tiket tetap tersimpan serta dapat diakses oleh pemilik tiket."
              : "Pendaftaran dan check-in ditutup. Event menjadi arsip hanya-baca dan tidak dapat diubah kembali. Tiket tetap dapat diakses."}
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
              aria-describedby={`${id}-confirmation-hint`}
              className="mt-0.5 size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" />
            {operation === "delete" ? "Saya mengonfirmasi penghapusan event ini." : "Saya mengonfirmasi event ini telah selesai."}
          </label>
        </>}
        <button type="submit" disabled={needsConfirmation && !confirmed}
          className={`min-h-11 rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 ${destructive ? "bg-red-700 text-white hover:bg-red-800" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
          {pending ? "Memproses..." : labels[operation]}
        </button>
      </fieldset>
    </form>
  );
}

export function EventLifecycleActions({ event, preview = false }: { event: Event; preview?: boolean }) {
  const headingId = useId();
  const status = { draft: "Draf", published: "Dipublikasikan", cancelled: "Dibatalkan", completed: "Selesai" }[event.status];
  const summaryClass = "cursor-pointer py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id={headingId} className="text-lg font-semibold">Status event</h2>
        <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">{status}</span>
      </div>
      {preview && <p role="status" className="rounded-md bg-muted p-3 text-sm">Mode pratinjau: perubahan dan pendaftaran dinonaktifkan.</p>}
      {event.deletedAt ? <p className="text-sm text-muted-foreground">Event telah dihapus. Tiket peserta tetap dapat diakses.</p> : event.status === "completed" ? (
        <p className="text-sm text-muted-foreground">Event telah selesai. Arsip hanya-baca; pendaftaran dan check-in ditutup. Tiket peserta tetap dapat diakses.</p>
      ) : <>
        {event.status === "draft" && <>
          <p className="text-sm text-muted-foreground">Publikasikan untuk menampilkan event dan membuka pendaftaran.</p>
          <LifecycleForm key={`${event.id}-publish`} eventId={event.id} operation="published" preview={preview} />
        </>}
        {event.status === "published" && <div className="divide-y border-y">
          <details>
            <summary className={summaryClass}>Selesaikan event</summary>
            <div className="pb-4"><LifecycleForm key={`${event.id}-complete`} eventId={event.id} operation="completed" preview={preview} /></div>
          </details>
          <details>
            <summary className={summaryClass}>Batalkan event</summary>
            <div className="pb-4"><LifecycleForm key={`${event.id}-cancel`} eventId={event.id} operation="cancelled" preview={preview} /></div>
          </details>
        </div>}
        {event.status === "cancelled" && <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">Event telah dibatalkan. Pendaftaran dan check-in ditutup; status tidak dapat diubah kembali.</p>
          {event.cancellationReason && <p className="whitespace-pre-wrap break-words">Alasan pembatalan: {event.cancellationReason}</p>}
        </div>}
        <details className="border-t">
          <summary className={summaryClass}>Hapus event</summary>
          <div className="pb-4"><LifecycleForm key={`${event.id}-delete`} eventId={event.id} operation="delete" preview={preview} /></div>
        </details>
      </>}
    </section>
  );
}
