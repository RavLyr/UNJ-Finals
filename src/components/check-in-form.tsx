"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { formatEventDate } from "@/lib/format-date";
import type { ActionResult } from "@/lib/types";
import { checkIn } from "@/server/actions/check-in";

type CheckInData = { name: string; ticketId: string; checkedInAt: string };

export function CheckInForm({ eventId, preview = false }: { eventId: string; preview?: boolean }) {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const handled = useRef<ActionResult<CheckInData> | null>(null);
  const [state, action, pending] = useActionState<ActionResult<CheckInData> | null, FormData>(checkIn, null);
  const failure = state && !state.success ? state : null;
  const success = state?.success ? state.data : null;
  const fieldErrors = failure?.fieldErrors;
  const inputClass = "min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-red-700 disabled:cursor-not-allowed";

  useEffect(() => {
    if (!state || handled.current === state) return;
    handled.current = state;
    if (!state.success) {
      const invalid = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      (invalid ?? form.current?.querySelector<HTMLElement>('[role="alert"]'))?.focus();
      return;
    }
    form.current?.reset();
    form.current?.querySelector<HTMLElement>('[role="status"]')?.focus();
  }, [state]);

  const alreadyCheckedIn = failure?.error.startsWith("Sudah check-in");

  return <form ref={form} action={action} aria-busy={pending} className="max-w-xl space-y-5">
    <input type="hidden" name="eventId" value={eventId} />
    {preview && <p role="status" className="rounded-md border bg-muted p-3 text-sm">Mode pratinjau: perubahan dan pendaftaran dinonaktifkan.</p>}
    <div className="space-y-2">
      <label htmlFor={`${id}-ticket`} className="block text-sm font-medium">ID tiket</label>
      <p id={`${id}-ticket-hint`} className="text-sm text-muted-foreground">
        Pindai QR tiket atau ketik ID tiket manual, format WBN-YYYYMMDD-XXXX.
      </p>
      <input
        id={`${id}-ticket`}
        name="ticketId"
        className={inputClass}
        placeholder="WBN-20261004-A1B2"
        required
        maxLength={17}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="characters"
        pattern="WBN-[0-9]{8}-[A-Z0-9]{4}"
        aria-invalid={Boolean(fieldErrors?.ticketId || failure)}
        aria-describedby={[`${id}-ticket-hint`, fieldErrors?.ticketId ? `${id}-ticket-error` : ""].filter(Boolean).join(" ")}
      />
      {fieldErrors?.ticketId && <p id={`${id}-ticket-error`} className="text-sm text-red-700">{fieldErrors.ticketId}</p>}
    </div>
    {failure && (
      <div role="alert" tabIndex={-1} className={`space-y-1 rounded-md border p-3 text-sm focus-visible:outline-2 focus-visible:outline-ring ${alreadyCheckedIn ? "border-amber-300 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800"}`}>
        <p>{failure.error}</p>
        {!alreadyCheckedIn && <p>Periksa kembali ID tiket yang dimasukkan, lalu coba lagi.</p>}
      </div>
    )}
    <fieldset disabled={preview || pending} className="space-y-2 disabled:opacity-60">
      <legend className="sr-only">Konfirmasi check-in peserta</legend>
      <button type="submit" className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed">
        {pending ? "Memproses..." : "Check-in"}
      </button>
    </fieldset>
    {success && (
      <div role="status" tabIndex={-1} className="space-y-1 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900 focus-visible:outline-2 focus-visible:outline-ring">
        <p className="font-medium">Check-in berhasil.</p>
        <p className="break-words [overflow-wrap:anywhere]">{success.name}</p>
        <p className="tabular-nums">{success.ticketId}</p>
        <p><time dateTime={success.checkedInAt}>{formatEventDate(success.checkedInAt)}</time></p>
      </div>
    )}
  </form>;
}
