import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, previewNotice } from "@/lib/auth";
import { authDestination } from "@/lib/auth.config";
import { formatEventDate } from "@/lib/format-date";
import { getOrganizerEvents } from "@/server/queries/organizer";

const statusLabels = {
  draft: "Draf",
  published: "Dipublikasikan",
  cancelled: "Dibatalkan",
  completed: "Selesai",
};
const statusStyles = {
  draft: "bg-muted text-foreground",
  published: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-slate-100 text-slate-700",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?redirect=%2Fdashboard");
  if (session.user.role !== "organizer") redirect(authDestination(session.user.role));
  const events = await getOrganizerEvents();
  const preview = process.env.VERCEL_ENV === "preview";
  const createClassName = "inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Event Anda</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola jadwal, kuota, dan status event.</p>
        </div>
        {events.length > 0 && (preview ? (
          <button type="button" disabled aria-describedby="create-preview-notice" className={createClassName}>Buat event</button>
        ) : (
          <Link href="/dashboard/events/new" className={createClassName}>Buat event</Link>
        ))}
      </div>
      {preview && <p id="create-preview-notice" className="rounded-md border bg-muted p-3 text-sm">{previewNotice}</p>}
      {events.length === 0 ? (
        <section aria-labelledby="empty-events-title" className="rounded-lg border px-6 py-8 text-center">
          <h2 id="empty-events-title" className="text-lg font-semibold">Belum ada event</h2>
          <p className="mb-6 mt-2 text-sm text-muted-foreground">Buat event pertama untuk mulai menerima pendaftaran.</p>
          {preview ? (
            <button type="button" disabled aria-describedby="create-preview-notice" className={createClassName}>Buat event pertama</button>
          ) : (
            <Link href="/dashboard/events/new" className={createClassName}>Buat event pertama</Link>
          )}
        </section>
      ) : (
        <div role="region" aria-label="Daftar event, geser horizontal untuk melihat semua kolom" tabIndex={0} className="max-w-full overflow-x-auto rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <table className="w-full min-w-[760px] table-fixed text-left text-sm">
            <caption className="sr-only">Daftar event milik workspace Anda</caption>
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="w-[24%] px-4 py-3 font-medium">Event</th>
                <th scope="col" className="w-[24%] px-4 py-3 font-medium">Jadwal (WIB)</th>
                <th scope="col" className="w-[16%] px-4 py-3 font-medium">Status</th>
                <th scope="col" className="w-[16%] px-4 py-3 font-medium">Kuota</th>
                <th scope="col" className="w-[20%] px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-accent">
                  <th scope="row" className="break-words px-4 py-3 font-medium [overflow-wrap:anywhere]">{event.title}</th>
                  <td className="px-4 py-3"><time dateTime={event.dateTime.toISOString()}>{formatEventDate(event.dateTime)}</time></td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[event.status]}`}>{statusLabels[event.status]}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <p>{event.registeredCount} terdaftar</p>
                    <p className="mt-1 text-xs text-muted-foreground">Sisa kuota: {event.maxQuota - event.registeredCount} dari {event.maxQuota}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <Link href={`/dashboard/events/${event.id}/registrants`} aria-label={`Peserta terdaftar: ${event.title}`} className="inline-flex min-h-10 items-center rounded-sm font-medium underline underline-offset-4 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        Peserta ({event.registeredCount})
                      </Link>
                      {event.status === "draft" || event.status === "published" ? (
                        <Link href={`/dashboard/events/${event.id}/check-in`} aria-label={`Check-in peserta: ${event.title}`} className="inline-flex min-h-10 items-center rounded-sm font-medium underline underline-offset-4 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          Check-in
                        </Link>
                      ) : null}
                      <Link href={`/dashboard/events/${event.id}/edit`} aria-label={`${event.status === "completed" ? "Lihat event" : "Edit event"}: ${event.title}`} className="inline-flex min-h-10 items-center rounded-sm font-medium underline underline-offset-4 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        {event.status === "completed" ? "Lihat event" : "Edit"}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
