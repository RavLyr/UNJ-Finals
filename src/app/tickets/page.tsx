import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { authDestination } from "@/lib/auth.config";
import { formatEventDate } from "@/lib/format-date";
import { getAttendeeTickets } from "@/server/queries/tickets";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

const statusBadge: Record<string, { className: string; label: string }> = {
  published: { className: "chip chip--success", label: "Aktif" },
  cancelled: { className: "chip chip--danger", label: "Dibatalkan" },
  completed: { className: "chip chip--info", label: "Selesai" },
};

export default async function TicketsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?redirect=/tickets");
  if (session.user.role !== "attendee") redirect(authDestination(session.user.role));

  const rows = await getAttendeeTickets();

  return (
    <div className="landing-page">
      <SiteHeader />
      <main className="tickets-page">
        <div className="container">
          <h1 className="tickets-page__title">Tiket Saya</h1>
          <p className="tickets-page__subtitle">
            {rows.length === 0
              ? "Anda belum memiliki tiket."
              : `${rows.length} tiket ditemukan.`}
          </p>
          {rows.length === 0 ? (
            <div className="tickets-page__empty">
              <p>Jelajahi event yang sedang berlangsung dan daftarkan diri Anda.</p>
              <Link href="/" className="btn btn--primary">
                Lihat Event
              </Link>
            </div>
          ) : (
            <ul className="tickets-list">
              {rows.map((row) => {
                const badge = statusBadge[row.eventStatus] ?? statusBadge.published;
                return (
                  <li key={row.ticketId}>
                    <Link
                      href={`/tickets/${row.ticketId}`}
                      className="tickets-list__item"
                    >
                      <div className="tickets-list__main">
                        <p className="tickets-list__event">{row.eventTitle}</p>
                        <p className="tickets-list__meta">
                          {formatEventDate(row.eventDateTime)}
                          {row.eventSpeaker ? ` · ${row.eventSpeaker}` : ""}
                        </p>
                        <p className="tickets-list__code">{row.ticketId}</p>
                      </div>
                      <span className={badge.className}>{badge.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
