import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckInForm } from "@/components/check-in-form";
import { formatEventDate } from "@/lib/format-date";
import { getOrganizerEvent } from "@/server/queries/organizer";

export default async function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getOrganizerEvent(id);
  if (!event) notFound();
  const preview = process.env.VERCEL_ENV === "preview";
  const closed = event.status === "cancelled" || event.status === "completed";

  return <>
    <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-sm text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Kembali ke daftar event</Link>
    <div>
      <h1 className="text-2xl font-bold">Check-in peserta</h1>
      <p className="mt-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{event.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        <time dateTime={event.dateTime.toISOString()}>{formatEventDate(event.dateTime)}</time>
        <span className="tabular-nums"> · {event.registeredCount} peserta terdaftar</span>
      </p>
      <Link href={`/dashboard/events/${event.id}/registrants`} className="mt-3 inline-flex min-h-10 items-center rounded-sm text-sm font-medium underline underline-offset-4 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        Lihat daftar peserta
      </Link>
    </div>
    {closed ? (
      <section aria-labelledby={`${event.id}-closed`} className="max-w-xl space-y-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <h2 id={`${event.id}-closed`} className="text-base font-semibold">Check-in ditutup</h2>
        <p>
          {event.status === "cancelled"
            ? "Event ini telah dibatalkan oleh organizer. Peserta tidak dapat di-check-in."
            : "Event ini sudah selesai. Daftar peserta hanya-baca dan tidak dapat di-check-in."}
        </p>
      </section>
    ) : (
      <section aria-labelledby={`${event.id}-form`} className="space-y-4">
        <h2 id={`${event.id}-form`} className="sr-only">Formulir check-in</h2>
        <CheckInForm key={`${event.id}-${event.status}`} eventId={event.id} preview={preview} />
      </section>
    )}
  </>;
}
