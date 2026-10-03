import { formatInTimeZone } from "date-fns-tz";
import { id } from "date-fns/locale";

const WIB_TIME_ZONE = "Asia/Jakarta";

// Format event date for display: Indonesian locale, WIB (UTC+7).
// Example: "Sabtu, 4 Oktober 2026 • 09.00 WIB"
export function formatEventDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${formatInTimeZone(d, WIB_TIME_ZONE, "EEEE, dd MMMM yyyy • HH.mm", {
    locale: id,
  })} WIB`;
}
