import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEventDate } from "@/lib/format-date";
import { getOrganizerEvent, getOrganizerRegistrants } from "@/server/queries/organizer";

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

export default async function RegistrantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getOrganizerEvent(id);
  if (!event) notFound();
  const registrations = await getOrganizerRegistrants(event.id);

  return <>
    <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-sm text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Kembali ke daftar event</Link>
    <div>
      <h1 className="text-2xl font-bold">Peserta terdaftar</h1>
      <p className="mt-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{event.title}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[event.status]}`}>{statusLabels[event.status]}</span>
        <span className="tabular-nums text-muted-foreground">
          {event.registeredCount} dari {event.maxQuota} kuota terisi
        </span>
      </div>
      {event.status === "completed" && (
        <p className="mt-3 rounded-md border bg-muted p-3 text-sm text-muted-foreground">
          Event selesai. Daftar peserta hanya-baca dan tidak dapat diubah.
        </p>
      )}
    </div>
    {registrations.length === 0 ? (
      <section aria-labelledby="empty-registrants-title" className="rounded-lg border px-6 py-8 text-center">
        <h2 id="empty-registrants-title" className="text-lg font-semibold">Belum ada peserta terdaftar.</h2>
        <p className="mt-2 text-sm text-muted-foreground">Pendaftaran akan muncul di sini setelah peserta mengisi formulir.</p>
      </section>
    ) : (
      <div role="region" aria-label="Daftar peserta, geser horizontal untuk melihat semua kolom" tabIndex={0} className="max-w-full overflow-x-auto rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <table className="w-full min-w-[820px] table-fixed text-left text-sm">
          <caption className="sr-only">Peserta terdaftar untuk event {event.title}</caption>
          <thead className="bg-muted">
            <tr>
              <th scope="col" className="w-[6%] px-4 py-3 font-medium">No</th>
              <th scope="col" className="w-[20%] px-4 py-3 font-medium">Nama</th>
              <th scope="col" className="w-[22%] px-4 py-3 font-medium">Email</th>
              <th scope="col" className="w-[15%] px-4 py-3 font-medium">Telepon</th>
              <th scope="col" className="w-[17%] px-4 py-3 font-medium">Ticket ID</th>
              <th scope="col" className="w-[12%] px-4 py-3 font-medium">Waktu daftar</th>
              <th scope="col" className="w-[8%] px-4 py-3 font-medium">Check-in</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {registrations.map((registration, index) => (
              <tr key={registration.id} className="hover:bg-accent">
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{index + 1}</td>
                <th scope="row" className="break-words px-4 py-3 font-medium [overflow-wrap:anywhere]">{registration.name}</th>
                <td className="break-words px-4 py-3 [overflow-wrap:anywhere]">{registration.email}</td>
                <td className="break-words px-4 py-3 [overflow-wrap:anywhere]">{registration.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <Link href={`/tickets/${registration.ticketId}`} target="_blank" rel="noopener" className="inline-flex min-h-10 items-center font-medium underline underline-offset-4 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    {registration.ticketId}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <time dateTime={registration.createdAt.toISOString()}>{formatEventDate(registration.createdAt)}</time>
                </td>
                <td className="px-4 py-3">
                  {registration.checkedInAt ? (
                    <span className="text-xs font-medium text-green-800">
                      <time dateTime={registration.checkedInAt.toISOString()}>{formatEventDate(registration.checkedInAt)}</time>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Belum</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </>;
}
