"use client";

import { QRCodeSVG } from "qrcode.react";

interface TicketCardProps {
  ticketId: string;
  name: string;
  email: string;
  eventTitle: string;
  eventDate: string;
  speaker: string | null;
}

export function TicketCard({ ticketId, name, email, eventTitle, eventDate, speaker }: TicketCardProps) {
  return (
    <div className="ticket">
      <div className="ticket__header">
        <p className="ticket__event-name">{eventTitle}</p>
        <p className="ticket__event-meta">{eventDate}</p>
      </div>
      <div className="ticket__body">
        <div className="ticket__info">
          <div className="ticket__row">
            <p className="ticket__label">Nama</p>
            <p className="ticket__value">{name}</p>
          </div>
          <div className="ticket__row">
            <p className="ticket__label">Email</p>
            <p className="ticket__value">{email}</p>
          </div>
          <div className="ticket__row">
            <p className="ticket__label">Event</p>
            <p className="ticket__value">{eventTitle}</p>
          </div>
          <div className="ticket__row">
            <p className="ticket__label">Tanggal</p>
            <p className="ticket__value">{eventDate}</p>
          </div>
          {speaker && (
            <div className="ticket__row">
              <p className="ticket__label">Pembicara</p>
              <p className="ticket__value">{speaker}</p>
            </div>
          )}
        </div>
        <div className="ticket__qr">
          <QRCodeSVG value={ticketId} size={200} level="M" includeMargin={true} />
        </div>
      </div>
      <div className="ticket__code">{ticketId}</div>
    </div>
  );
}
