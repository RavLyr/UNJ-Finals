import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RegistrationPanel } from "@/components/registration-panel";
import { getDb } from "@/server/db";
import { events, workspaces, users } from "@/server/db/schema";
import { auth } from "@/lib/auth";
import { formatEventDate } from "@/lib/format-date";
import type { Event } from "@/lib/types";

export const dynamic = "force-dynamic";

interface EventDetailPageProps {
  params: Promise<{ workspaceSlug: string; eventSlug: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { workspaceSlug, eventSlug } = await params;

  const rows = await getDb()
    .select({
      event: events,
      workspaceSlug: workspaces.slug,
      workspaceName: workspaces.name,
      organizerEmail: users.email,
      organizerName: users.name,
    })
    .from(events)
    .innerJoin(workspaces, eq(events.workspaceId, workspaces.id))
    .innerJoin(users, eq(workspaces.ownerId, users.id))
    .where(
      and(
        eq(workspaces.slug, workspaceSlug),
        eq(events.slug, eventSlug),
        isNull(events.deletedAt),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) notFound();

  const event = row.event as Event;
  if (event.status === "draft") notFound();

  const session = await auth();
  const sessionName = session?.user?.name ?? "";
  const sessionEmail = session?.user?.email ?? "";

  return (
    <>
      <SiteHeader />
      <main className="event-detail">
        <div className="container">
          {event.status === "cancelled" && (
            <div className="chip chip--danger" style={{ display: "block", padding: "16px", marginBottom: "var(--space-lg)" }}>
              <strong>Event ini telah dibatalkan oleh organizer.</strong>
              {event.cancellationReason && <p style={{ margin: "4px 0 0" }}>{event.cancellationReason}</p>}
              <p style={{ margin: "4px 0 0" }}>
                Hubungi organizer: <a href={`mailto:${row.organizerEmail}`}>{row.organizerEmail}</a>
              </p>
            </div>
          )}
          {event.status === "completed" && (
            <div className="chip" style={{ display: "block", padding: "16px", marginBottom: "var(--space-lg)" }}>
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
                  <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                    {row.organizerName ?? row.workspaceName}
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
    </>
  );
}
