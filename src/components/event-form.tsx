"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { toast } from "sonner";
import { formatEventDate } from "@/lib/format-date";
import type { ActionResult, Event } from "@/lib/types";
import { createEvent, updateEvent } from "@/server/actions/events";

export type EventFormProps = { event?: Event; preview?: boolean };

export function EventForm({ event, preview = false }: EventFormProps) {
  const router = useRouter();
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const handled = useRef<ActionResult<{ eventId: string } | null> | null>(null);
  const cancelled = event?.status === "cancelled";
  const [values, setValues] = useState({
    title: event?.title ?? "",
    description: event?.description ?? "",
    dateTime: event ? formatInTimeZone(event.dateTime, "Asia/Jakarta", "yyyy-MM-dd'T'HH:mm:ss") : "",
    maxQuota: event ? String(event.maxQuota) : "",
    speaker: event?.speaker ?? "",
    bannerUrl: event?.bannerUrl ?? "",
    tags: event?.tags ?? "",
    cancellationReason: event?.cancellationReason ?? "",
  });
  const [state, action, pending] = useActionState<ActionResult<{ eventId: string } | null> | null, FormData>(
    async (_previous, data) => event ? updateEvent(null, data) : createEvent(null, data), null,
  );
  const failure = state && !state.success ? state : null;

  useEffect(() => {
    if (!state || handled.current === state) return;
    handled.current = state;
    if (!state.success) {
      const invalid = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      (invalid ?? form.current?.querySelector<HTMLElement>('[role="alert"]'))?.focus();
      return;
    }
    toast.success("Perubahan event berhasil disimpan.");
    router.refresh();
  }, [state, router]);

  if (event?.status === "completed") {
    const details = [
      ["Judul", event.title], ["Deskripsi", event.description],
      ["Jadwal (WIB)", formatEventDate(event.dateTime)],
      ["Kuota", `${event.registeredCount} terdaftar dari ${event.maxQuota}`],
      ["Pembicara", event.speaker || "Belum diisi"],
      ["URL banner", event.bannerUrl || "Belum diisi"],
      ["Tag", event.tags || "Belum diisi"], ["Slug", event.slug],
    ];
    return <section aria-labelledby={`${id}-details`} className="space-y-4">
      <h2 id={`${id}-details`} className="text-lg font-semibold">Detail event</h2>
      <p className="text-sm text-muted-foreground">Event selesai hanya dapat dilihat. Detail tidak dapat diubah.</p>
      <dl className="divide-y rounded-lg border px-4 sm:px-6">
        {details.map(([label, value]) => <div key={label} className="grid gap-1 py-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
          <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
          <dd className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{value}</dd>
        </div>)}
      </dl>
    </section>;
  }

  const fields: {
    name: keyof typeof values; label: string; hint?: string; type?: string;
    required?: boolean; minLength?: number; maxLength?: number; min?: number;
    max?: number; step?: number; multiline?: boolean; pattern?: string;
  }[] = [
    { name: "title", label: "Judul event", required: true, minLength: 5, maxLength: 200 },
    { name: "description", label: "Deskripsi", required: true, minLength: 10, maxLength: 5000, multiline: true, hint: "10–5.000 karakter, berupa teks biasa." },
    ...(!cancelled ? [
      { name: "dateTime" as const, label: "Tanggal dan waktu (WIB)", type: "datetime-local", required: true, step: 1, hint: "Waktu Indonesia Barat (UTC+7), terlepas dari zona waktu perangkat Anda." },
      { name: "maxQuota" as const, label: "Kuota peserta", type: "number", required: true, min: Math.max(1, event?.registeredCount ?? 0), max: 10000, step: 1, hint: event ? `${event.registeredCount} peserta terdaftar. Kuota tidak boleh lebih kecil dari jumlah peserta; maksimal 10.000.` : "1–10.000 peserta." },
    ] : []),
    { name: "speaker", label: "Pembicara (opsional)", maxLength: 200 },
    { name: "bannerUrl", label: "URL banner (opsional)", type: "url", maxLength: 500, pattern: "https://.*", hint: "Gunakan URL gambar HTTPS." },
    { name: "tags", label: "Tag (opsional)", maxLength: 200, hint: "Pisahkan dengan koma, maksimal 5 tag." },
    ...(cancelled ? [{ name: "cancellationReason" as const, label: "Alasan pembatalan", required: true, maxLength: 1000, multiline: true, hint: "Alasan ditampilkan kepada peserta." }] : []),
  ];
  const inputClass = "min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-red-700 disabled:cursor-not-allowed";

  return <form ref={form} action={action} aria-busy={pending} className="max-w-3xl space-y-6">
    {event && <input type="hidden" name="eventId" value={event.id} />}
    {!cancelled && <input type="hidden" name="dateTime" value={values.dateTime ? `${values.dateTime}+07:00` : ""} />}
    {preview && <p role="status" className="rounded-md border bg-muted p-3 text-sm">Mode pratinjau: perubahan dan pendaftaran dinonaktifkan.</p>}
    {failure && <div role="alert" tabIndex={-1} className="space-y-1 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 focus-visible:outline-2 focus-visible:outline-ring">
      <p>{failure.error}</p>
      <p>Periksa data di bawah, lalu coba simpan kembali. Isian Anda tetap tersimpan di formulir.</p>
      {failure.fieldErrors && <ul className="list-inside list-disc">
        {Object.entries(failure.fieldErrors).filter(([name]) => !fields.some((field) => field.name === name)).map(([name, message]) => <li key={name}>{message}</li>)}
      </ul>}
    </div>}
    {cancelled && event && <section aria-labelledby={`${id}-frozen`} className="space-y-3 rounded-md border bg-muted p-4">
      <h2 id={`${id}-frozen`} className="text-base font-semibold">Event dibatalkan</h2>
      <p className="text-sm">Hanya metadata dan alasan pembatalan yang dapat diubah. Jadwal, kuota, dan slug tetap.</p>
      <dl className="space-y-2 text-sm">
        <div><dt className="font-medium">Jadwal (WIB)</dt><dd>{formatEventDate(event.dateTime)}</dd></div>
        <div><dt className="font-medium">Kuota</dt><dd>{event.registeredCount} terdaftar dari {event.maxQuota}</dd></div>
        <div><dt className="font-medium">Slug</dt><dd className="break-words [overflow-wrap:anywhere]">{event.slug}</dd></div>
      </dl>
    </section>}
    <fieldset disabled={preview || pending} className="space-y-5 disabled:opacity-60">
      <legend className="sr-only">{event ? "Edit detail event" : "Detail event baru"}</legend>
      {fields.map((field) => {
        const error = failure?.fieldErrors?.[field.name];
        const fieldId = `${id}-${field.name}`;
        const props = {
          id: fieldId, name: field.name === "dateTime" ? "dateTimeWib" : field.name,
          value: values[field.name], required: field.required,
          minLength: field.minLength, maxLength: field.maxLength,
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((current) => ({ ...current, [field.name]: e.target.value })),
          "aria-invalid": Boolean(error),
          "aria-describedby": [field.hint ? `${fieldId}-hint` : "", error ? `${fieldId}-error` : ""].filter(Boolean).join(" ") || undefined,
          className: inputClass,
        };
        return <div key={field.name} className="space-y-2">
          <label htmlFor={fieldId} className="block text-sm font-medium">{field.label}</label>
          {field.hint && <p id={`${fieldId}-hint`} className="text-sm text-muted-foreground">{field.hint}</p>}
          {field.multiline ? <textarea {...props} rows={field.name === "description" ? 6 : 3} className={`${inputClass} resize-y`} /> : <input {...props} type={field.type ?? "text"} min={field.min} max={field.max} step={field.step} pattern={field.pattern} />}
          {error && <p id={`${fieldId}-error`} className="text-sm text-red-700">{error}</p>}
        </div>;
      })}
      <button type="submit" className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed">
        {pending ? "Menyimpan..." : event ? "Simpan perubahan" : "Buat event"}
      </button>
    </fieldset>
  </form>;
}
