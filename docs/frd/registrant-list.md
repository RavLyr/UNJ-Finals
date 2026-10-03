# FRD: Registrant List

## Route

`/dashboard/events/[id]/registrants`

## Authorization

Server obtains session user, then queries only when `event.workspace_id` belongs to workspace owned by that user. Unknown, deleted, or other-tenant event returns 404, not authorization detail.

## Display

Header: event title, lifecycle status, `registered_count / max_quota`.

| Column | Source |
|---|---|
| No | List index |
| Nama | `registrations.name` |
| Email | `registrations.email` |
| Telepon | `registrations.phone` or `—` |
| Ticket ID | Link to `/success/[ticketId]`, `target="_blank" rel="noopener"` |
| Waktu daftar | `formatTimestamp(created_at)` |
| Check-in | Phase 1: `checked_in_at` status |

Default sort: latest registration first. Empty state: "Belum ada peserta terdaftar."

Completed events remain viewable read-only. Soft-deleted events are unavailable from dashboard but their public tickets remain accessible.
