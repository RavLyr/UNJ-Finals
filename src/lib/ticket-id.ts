import { format } from "date-fns";

// Ticket ID format: WBN-YYYYMMDD-XXXX (UTC server date) — CONTRACT.md §7.
export function generateTicketId(): string {
  const date = new Date();
  const dateStr = format(date, "yyyyMMdd");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const random = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return `WBN-${dateStr}-${random}`;
}
