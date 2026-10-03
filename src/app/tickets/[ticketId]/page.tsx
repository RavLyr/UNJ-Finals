import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { authDestination } from "@/lib/auth.config";
import { formatEventDate } from "@/lib/format-date";
import { getAttendeeTicket } from "@/server/queries/tickets";
import { RegistrationSuccessToast } from "@/components/registration-success-toast";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TicketCard } from "@/components/ticket-card";
import { TicketPdfButton } from "@/components/ticket-pdf-button";

export const dynamic = "force-dynamic";

interface TicketPageProps {
  params: Promise<{ ticketId: string }>;
  searchParams: Promise<{ registered?: string }>;
}

export default async function TicketPage({ params, searchParams }: TicketPageProps) {
  const [{ ticketId }, { registered }] = await Promise.all([params, searchParams]);
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?redirect=/tickets/${encodeURIComponent(ticketId)}`);
  if (session.user.role !== "attendee") redirect(authDestination(session.user.role));

  const row = await getAttendeeTicket(ticketId);

  if (!row) notFound();

  const eventDate = formatEventDate(row.eventDateTime);

  return (
    <div className="landing-page">
      <SiteHeader />
      <main className="ticket-page">
        <div className="container">
          {registered === "1" && <RegistrationSuccessToast email={row.email} />}
          {row.eventStatus === "cancelled" && (
            <div className="chip chip--danger" style={{ display: "block", padding: "16px", marginBottom: "var(--landing-space-lg)" }}>
              <strong>Event ini telah dibatalkan.</strong>
            </div>
          )}
          {row.eventStatus === "completed" && (
            <div className="chip chip--info" style={{ display: "block", padding: "16px", marginBottom: "var(--landing-space-lg)" }}>
              Event ini telah selesai.
            </div>
          )}
          <TicketCard
            ticketId={row.ticketId}
            name={row.name}
            email={row.email}
            eventTitle={row.eventTitle}
            eventDate={eventDate}
            speaker={row.eventSpeaker}
          />
          <div className="ticket-page__actions">
            <TicketPdfButton
              ticket={{
                ticketId: row.ticketId,
                name: row.name,
                email: row.email,
                eventTitle: row.eventTitle,
                eventDate,
                speaker: row.eventSpeaker,
              }}
            />
            <Link
              href={`/w/${row.workspaceSlug}/events/${row.eventSlug}`}
              className="btn btn--secondary"
            >
              Lihat Event
            </Link>
            <Link href="/tickets" className="btn btn--secondary">
              Semua Tiket
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
