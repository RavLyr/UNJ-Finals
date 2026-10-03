import type { Event } from "@/lib/types";
import { formatEventDate } from "@/lib/format-date";
import { RegistrationForm } from "@/components/registration-form";

interface RegistrationPanelProps {
  event: Event;
  sessionName: string;
  sessionEmail: string;
}

export function RegistrationPanel({ event, sessionName, sessionEmail }: RegistrationPanelProps) {
  const remaining = event.maxQuota - event.registeredCount;
  const fillPercent = Math.min(100, Math.round((event.registeredCount / event.maxQuota) * 100));
  const isFull = remaining <= 0;

  return (
    <aside className="event-detail__sidebar">
      <div className="event-detail__ticket-card">
        <div className="event-detail__ticket-row">
          <span className="event-detail__ticket-row-label">Tanggal</span>
          <span className="event-detail__ticket-row-value">{formatEventDate(event.dateTime)}</span>
        </div>
        <div className="event-detail__ticket-row">
          <span className="event-detail__ticket-row-label">Pembicara</span>
          <span className="event-detail__ticket-row-value">{event.speaker ?? "—"}</span>
        </div>
        <div className="event-detail__ticket-row">
          <span className="event-detail__ticket-row-label">Harga tiket</span>
          <span className="event-detail__ticket-row-value event-card__price--free">Gratis</span>
        </div>
        <hr className="divider" style={{ margin: "var(--space-md) 0" }} />
        <div className="event-detail__quota">
          <div className="event-detail__quota-text">
            Sisa kuota: {remaining} dari {event.maxQuota}
          </div>
          <div className="progress">
            <div className="progress__bar" style={{ width: `${fillPercent}%` }} />
          </div>
        </div>

        {event.status === "published" && !isFull && (
          <RegistrationForm
            eventId={event.id}
            defaultName={sessionName}
            defaultEmail={sessionEmail}
          />
        )}

        {event.status === "published" && isFull && (
          <div className="chip chip--danger" style={{ display: "block", textAlign: "center", padding: "12px" }}>
            Kuota Penuh
          </div>
        )}

        {event.status === "cancelled" && (
          <div className="chip chip--danger" style={{ display: "block", padding: "12px" }}>
            <strong>Event ini telah dibatalkan oleh organizer.</strong>
            {event.cancellationReason && (
              <p style={{ margin: "4px 0 0", fontWeight: 400 }}>{event.cancellationReason}</p>
            )}
          </div>
        )}

        {event.status === "completed" && (
          <div className="chip" style={{ display: "block", padding: "12px", textAlign: "center" }}>
            Event ini telah selesai
          </div>
        )}
      </div>
    </aside>
  );
}
