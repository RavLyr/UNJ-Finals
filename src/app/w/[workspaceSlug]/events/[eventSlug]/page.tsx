import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RegistrationPanel } from "@/components/registration-panel";
import { getEventByWorkspaceSlug } from "@/server/queries/public";
import { auth } from "@/lib/auth";
import { formatEventDate } from "@/lib/format-date";

export const dynamic = "force-dynamic";

interface EventDetailPageProps {
  params: Promise<{ workspaceSlug: string; eventSlug: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { workspaceSlug, eventSlug } = await params;

  const row = await getEventByWorkspaceSlug(workspaceSlug, eventSlug);
  if (!row) notFound();

  const { event } = row;

  const session = await auth();
  const sessionName = session?.user?.name ?? "";
  const sessionEmail = session?.user?.email ?? "";

  return (
    <div className="landing-page">
      <SiteHeader />
      <main className="event-detail">
        <div className="container">
          {event.status === "cancelled" && (
            <div className="chip chip--danger" style={{ display: "block", padding: "16px", marginBottom: "var(--landing-space-lg)" }}>
              <strong>Event ini telah dibatalkan oleh organizer.</strong>
              {event.cancellationReason && <p style={{ margin: "4px 0 0" }}>{event.cancellationReason}</p>}
              <p style={{ margin: "4px 0 0" }}>
                Hubungi organizer: <a href={`mailto:${row.organizerEmail}`}>{row.organizerEmail}</a>
              </p>
            </div>
          )}
          {event.status === "completed" && (
            <div className="chip" style={{ display: "block", padding: "16px", marginBottom: "var(--landing-space-lg)" }}>
              Event ini telah selesai. Tiket lama tetap dapat dilihat di dashboard Anda.
            </div>
          )}

          <div className="event-detail__layout">
            <article>
              <div className="event-detail__cover">
                {event.bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.bannerUrl} alt={event.title} loading="lazy" />
                ) : (
                  <div className="event-card__cover-fallback" style={{ width: "100%", height: "100%" }} aria-hidden="true" />
                )}
              </div>

              <h1 className="event-detail__title">{event.title}</h1>

              <div className="event-detail__hosts">
                <div className="avatar avatar--lg">
                  {(row.organizerName ?? "O").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "var(--landing-text-sm)" }}>
                    {row.organizerName ?? row.workspace.name}
                  </div>
                  <div className="event-detail__hosts-label">Penyelenggara</div>
                </div>
              </div>

              <div className="event-detail__section">
                <h2 className="event-detail__section-title">Tentang Acara</h2>
                <p className="event-detail__text">{event.description}</p>
              </div>

              {event.tags && (
                <div className="event-detail__section">
                  <h2 className="event-detail__section-title">Kategori</h2>
                  <div className="discover__chips">
                    {event.tags.split(",").map((tag) => (
                      <span key={tag.trim()} className="chip">{tag.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="event-detail__section">
                <h2 className="event-detail__section-title">Jadwal</h2>
                <p className="event-detail__text">{formatEventDate(event.dateTime)}</p>
              </div>
            </article>

            <RegistrationPanel
              event={event}
              sessionName={sessionName}
              sessionEmail={sessionEmail}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
