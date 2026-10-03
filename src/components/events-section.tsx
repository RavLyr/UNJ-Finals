import type { Event } from "@/lib/types";
import { EventCard } from "@/components/event-card";

interface PublishedEvent {
  event: Event;
  workspaceSlug: string;
}

interface EventsSectionProps {
  events: PublishedEvent[];
}

export function EventsSection({ events }: EventsSectionProps) {
  return (
    <section id="event" className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <h2 className="cta__title" style={{ fontSize: "var(--text-4xl)", textAlign: "left", marginBottom: "var(--space-xl)" }}>
          Event mendatang
        </h2>
        {events.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">Belum ada event</p>
            <p className="empty-state__desc">
              Event yang dipublikasikan akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map(({ event, workspaceSlug }) => (
              <EventCard
                key={event.id}
                event={event}
                workspaceSlug={workspaceSlug}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
