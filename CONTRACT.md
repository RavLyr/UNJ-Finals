# CONTRACT.md — Single Source of Truth

> **Agent A dan B wajib baca file ini sebelum mulai work.**
> Agent read-only. Perubahan via human (orchestrator).
> Agent tidak boleh buat product/technical decision sendiri. Kalau blocked/uncertain, berhenti dan tanya.

---

## 1. Schema (Drizzle ORM)

All timestamps `timestamptz`. IDs UUID. All fields required unless suffixed `?`.

### users
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| email | text | unique, not null |
| name | text | |
| image | text | |
| password_hash | text | nullable (OAuth-only users) |
| role | text | default 'attendee', values: organizer \| attendee \| platform_admin |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### workspaces
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| owner_id | uuid | FK users.id, unique (one workspace per organizer) |
| name | text | not null |
| slug | text | unique, not null |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### events
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| workspace_id | uuid | FK workspaces.id |
| title | text | not null |
| slug | text | not null |
| description | text | not null |
| date_time | timestamptz | not null |
| max_quota | integer | not null, check > 0 |
| registered_count | integer | default 0 |
| speaker | text | |
| banner_url | text | |
| tags | text | comma-separated, max 5 |
| status | text | default 'draft', values: draft \| published \| cancelled \| completed |
| cancellation_reason | text | nullable |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |
| deleted_at | timestamptz | nullable (soft delete) |
| | | partial unique (workspace_id, slug) WHERE deleted_at IS NULL |

### registrations
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| event_id | uuid | FK events.id |
| attendee_id | uuid | FK users.id |
| name | text | not null |
| email | text | not null, lowercase |
| phone | text | |
| ticket_id | text | unique, not null, format: WBN-YYYYMMDD-XXXX |
| checked_in_at | timestamptz | nullable |
| created_at | timestamptz | default now() |
| | | unique (event_id, email) |

**Tidak ada sessions table** (JWT strategy). **Tidak ada verification_tokens** (skip email verification). **Tidak ada ticket_token** (tiket via account login).

---

## 2. Server Actions

All in `src/server/actions/`. Return type `ActionResult<T>` from `src/lib/types.ts`.

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string> };
```

### registerParticipant (src/server/actions/register.ts)
```typescript
"use server"
export async function registerParticipant(
  prevState: ActionResult<{ ticketId: string }> | null,
  formData: FormData
): Promise<ActionResult<{ ticketId: string }>>
```
- **Require attendee session** — if not logged in, redirect to `/signin?redirect=${currentUrl}`
- Zod parse formData (registrationSchema)
- DB transaction:
  1. SELECT event WHERE id = ? AND status = 'published' AND deleted_at IS NULL
  2. UPDATE events SET registered_count = registered_count + 1 WHERE id = ? AND registered_count < max_quota RETURNING id
  3. No row → ROLLBACK, return "Kuota sudah habis" or "Event tidak ditemukan"
  4. Generate ticketId
  5. INSERT registration (attendee_id = session.user.id)
  6. Unique violation → ROLLBACK, return "Email sudah terdaftar"
- revalidatePath(`/w/${workspaceSlug}/events/${eventSlug}`)
- redirect(`/tickets/${ticketId}`) ← throws, must be last line

### createEvent (src/server/actions/events.ts)
```typescript
"use server"
export async function createEvent(
  prevState: ActionResult<{ eventId: string }> | null,
  formData: FormData
): Promise<ActionResult<{ eventId: string }>>
```
- Authorize: session user role = organizer → workspace.owner_id = user.id
- Validate (eventSchema)
- Generate slug from title (unique within workspace)
- INSERT event (status = draft)
- revalidatePath('/dashboard')
- redirect('/dashboard')

### updateEvent (src/server/actions/events.ts)
```typescript
"use server"
export async function updateEvent(
  prevState: ActionResult<null> | null,
  formData: FormData
): Promise<ActionResult<null>>
```
- Authorize event workspace
- Validate full replacement
- Reject if max_quota < registered_count
- UPDATE event
- revalidatePath public + dashboard paths

### setEventStatus (src/server/actions/events.ts)
```typescript
"use server"
export async function setEventStatus(
  prevState: ActionResult<null> | null,
  formData: FormData
): Promise<ActionResult<null>>
```
- Authorize event workspace
- Validate lifecycle transition
- If cancelled: require cancellation_reason
- UPDATE status
- revalidatePath public + dashboard paths

### deleteEvent (src/server/actions/events.ts)
```typescript
"use server"
export async function deleteEvent(
  prevState: ActionResult<null> | null,
  formData: FormData
): Promise<ActionResult<null>>
```
- Authorize event workspace
- Soft delete: SET deleted_at = now()
- Registrations/tickets remain accessible

### checkIn (src/server/actions/check-in.ts)
```typescript
"use server"
export async function checkIn(
  prevState: ActionResult<{ name: string; ticketId: string; checkedInAt: string }> | null,
  formData: FormData
): Promise<ActionResult<{ name: string; ticketId: string; checkedInAt: string }>>
```
- Authorize event workspace
- Find registration by ticket_id + event_id
- If checked_in_at IS NOT NULL → return "Sudah check-in pada {timestamp}"
- If event cancelled/completed → return "Event tidak valid untuk check-in"
- SET checked_in_at = NOW()
- Return { name, ticketId, checkedInAt }

---

## 3. Routes

### Public
| Route | Purpose |
|---|---|
| `/` | Landing: published event discovery (Luma-style) |
| `/w/[workspaceSlug]/events/[eventSlug]` | Event detail + registration (login required for registration) |

### Auth
| Route | Purpose |
|---|---|
| `/register` | Registration (organizer + attendee) |
| `/signin` | Login (credentials + Google OAuth) |

### Organizer Dashboard (protected, role = organizer)
| Route | Purpose |
|---|---|
| `/dashboard` | Event list |
| `/dashboard/events/new` | Create event |
| `/dashboard/events/[id]/edit` | Edit/lifecycle event |
| `/dashboard/events/[id]/registrants` | Registrant list |
| `/dashboard/events/[id]/check-in` | QR/manual check-in |
| `/dashboard/settings` | Organizer profile/settings |

### Attendee Dashboard (protected, role = attendee)
| Route | Purpose |
|---|---|
| `/tickets` | Daftar tiket attendee |
| `/tickets/[ticketId]` | Detail tiket (PDF download) |
| `/settings` | Attendee profile/settings |

### System
| Route | Purpose |
|---|---|
| `/not-found` | Custom 404 |
| Error boundary | `error.tsx` at root + dashboard |

---

## 4. Shared Types (src/lib/types.ts)

```typescript
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'organizer' | 'attendee' | 'platform_admin';
}

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
}

export interface Event {
  id: string;
  workspaceId: string;
  title: string;
  slug: string;
  description: string;
  dateTime: Date;
  maxQuota: number;
  registeredCount: number;
  speaker: string | null;
  bannerUrl: string | null;
  tags: string | null;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Registration {
  id: string;
  eventId: string;
  attendeeId: string;
  name: string;
  email: string;
  phone: string | null;
  ticketId: string;
  checkedInAt: Date | null;
  createdAt: Date;
}
```

---

## 5. Auth Flow

- NextAuth.js v5 + @auth/drizzle-adapter
- **Provider: Credentials only** (email + password, bcryptjs)
- JWT session strategy, 8-hour expiry
- **Role-based redirect after login**:
  - organizer → `/dashboard`
  - attendee → `/tickets`
  - platform_admin → `/admin` (Phase 2)
- **Organizer registration**: register with name, email, password → role = organizer. First login → bootstrap workspace atomically:
  - name = organizer name
  - slug = generateSlug(organizer name) + unique suffix if needed
- **Attendee registration**: register with name, email, password → role = attendee
- PLATFORM_ADMIN_EMAILS env → role = platform_admin
- Middleware protect /dashboard/* (organizer only) and /tickets/* (attendee only)

---

## 6. Quota Algorithm

```sql
UPDATE events
SET registered_count = registered_count + 1, updated_at = NOW()
WHERE id = $event_id
  AND status = 'published'
  AND deleted_at IS NULL
  AND registered_count < max_quota
RETURNING id;
```
- No row → reject (full/unavailable)
- Insert registration
- Unique violation → ROLLBACK (counter rollback)
- Never use COUNT(registrations) as guard

---

## 7. Ticket ID Generator (src/lib/ticket-id.ts)

```typescript
export function generateTicketId(): string {
  const date = new Date();
  const dateStr = format(date, "yyyyMMdd");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const random = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `WBN-${dateStr}-${random}`;
}
```
- Date: UTC server date
- Collision: retry 1x, then throw

---

## 8. Ticket Access

- **Via account login** — no token needed
- `/tickets/[ticketId]` protected by attendee session
- Server verify: `session.user.id === registrations.attendee_id`
- If not owner → 404
- Attendee can see all their tickets at `/tickets`

---

## 9. Notif Mock (Sonner Toast)

After successful registration:
```typescript
toast.success("Pendaftaran berhasil! Simpan tiket Anda.");
toast.success(`Email konfirmasi telah dikirim ke ${email}`);
```
- No real email sending
- Phase 2: real email via Resend/SendGrid

---

## 10. PDF Download

- Library: `pdfmake` (client-side)
- Button "Download PDF" di halaman tiket
- Generate PDF dari data tiket (QR + detail)
- Print-friendly CSS sebagai fallback

---

## 11. Cancelled Event

- events.cancellation_reason: text nullable
- Public event page (cancelled):
  - Banner: "Event ini telah dibatalkan oleh organizer"
  - Show cancellation_reason if exists
  - Show email organizer (via workspaces → users join)
  - Form not rendered
  - Old tickets remain accessible
- Ticket page (cancelled event):
  - Banner merah: "Event ini telah dibatalkan"
  - QR + ticket ID tetap tampil

---

## 12. Event Lifecycle

| Status | Public page | Registration | Organizer edit | Ticket |
|---|---|---|---|---|
| Draft | 404 | Closed | Full edit | N/A |
| Published | Visible | Open if quota | Full edit subject quota rule | Available |
| Cancelled | Visible + cancellation notice | Closed | Limited metadata | Available + cancelled banner |
| Completed | Archive/read-only | Closed | Read-only | Available + completed banner |

---

## 13. Preview Read-only Mode

- VERCEL_ENV=preview → all Server Action writes return preview notice
- Banner: "Mode pratinjau: perubahan dan pendaftaran dinonaktifkan."
- Demo/test data only

---

## 14. File Ownership

| Path | Owner |
|---|---|
| src/server/db/schema.ts | Agent A |
| src/server/db/index.ts | Agent A |
| src/server/actions/ | Agent A (events, check-in), Agent B (register) |
| src/server/queries/ | Agent A |
| src/lib/auth.ts | Agent A |
| src/lib/validations.ts | Agent B |
| src/lib/types.ts | Agent B |
| src/lib/ticket-id.ts | Agent B |
| src/lib/format-date.ts | Agent B |
| src/lib/slug.ts | Agent B |
| src/app/ (public pages) | Agent B |
| src/app/dashboard/ | Agent A |
| src/app/tickets/ | Agent B |
| src/components/ (public) | Agent B |
| src/components/ (dashboard) | Agent A |
| src/middleware.ts | Agent A |
| CONTRACT.md | Human only |
