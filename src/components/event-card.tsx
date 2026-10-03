import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Event } from "@/lib/types";
import { formatEventDate } from "@/lib/format-date";

interface EventCardProps {
  event: Event;
  workspaceSlug: string;
}

export function EventCard({ event, workspaceSlug }: EventCardProps) {
  const remaining = event.maxQuota - event.registeredCount;
  const date = event.dateTime;

  return (
    <Link
      href={`/w/${workspaceSlug}/events/${event.slug}`}
      className="event-card"
    >
      <div className="event-card__cover">
        {event.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.bannerUrl} alt={event.title} loading="lazy" />
        ) : (
          <div className="event-card__cover-fallback" aria-hidden="true" />
        )}
        <div className="event-card__date-badge">
          <span className="event-card__date-day">{format(date, "dd")}</span>
          <span className="event-card__date-month">
            {format(date, "MMM", { locale: id })}
          </span>
        </div>
      </div>
      <div className="event-card__body">
        <h3 className="event-card__title">{event.title}</h3>
        <div className="event-card__meta">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <time dateTime={date.toISOString()}>{formatEventDate(date)}</time>
        </div>
        {event.speaker && (
          <div className="event-card__meta">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{event.speaker}</span>
          </div>
        )}
        <div className="event-card__footer">
          <span className="event-card__price event-card__price--free">
            Gratis
          </span>
          <span className="event-card__stock">Sisa {remaining} tiket</span>
        </div>
      </div>
    </Link>
  );
}
