# Architecture — SaaS Reservasi Webinar & E-Ticketing

## Architecture Shape

Next.js 15 fullstack monolith. Server Components untuk read; Server Actions untuk mutation. Supabase hanya managed PostgreSQL. Drizzle (`postgres` driver) satu-satunya data access layer.

```
Browser
  ├─ Public: landing → workspace event → guest registration → ticket
  └─ Organizer: NextAuth → dashboard → Server Actions
                                      │
                              Drizzle server-only
                                      │
                           Supabase PostgreSQL
```

Tidak ada `@supabase/supabase-js`, browser database client, Supabase Auth, atau RLS pada MVP. RLS wajib sebelum direct browser access atau external API.

## Stack

| Layer | Choice |
|---|---|
| Runtime | Bun |
| Framework | Next.js 15, React 19, App Router |
| Styling | Tailwind CSS v4 + shadcn/ui + Sonner |
| Auth | NextAuth.js v5, Credentials + Google OAuth |
| Database | Supabase PostgreSQL |
| ORM/driver | Drizzle ORM + postgres.js |
| Validation | Zod |
| QR | qrcode.react |
| Date | date-fns + locale `id` |

## Tenant Model

- One `user` owns exactly one `workspace`; organizer tidak dapat bergabung ke workspace lain.
- Every tenant-owned record has `workspace_id` directly or reaches one through `event.workspace_id`.
- Every organizer Server Action derives user from server session, verifies `workspace.owner_id = user.id`, then mutates. Never trust workspace ID from browser alone.
- Platform admin is an allowlisted email role; it has no implicit tenant bypass.

## Routes

| Route | Audience | Purpose |
|---|---|---|
| `/` | Public | Luma-inspired published event discovery |
| `/w/[workspaceSlug]/events/[eventSlug]` | Public | Event detail + registration |
| `/success/[ticketId]` | Public | Permanent e-ticket |
| `/login`, `/register` | Organizer | Credentials/Google sign-in |
| `/dashboard` | Organizer | Workspace event list |
| `/dashboard/events/new` | Organizer | Create event |
| `/dashboard/events/[id]/edit` | Organizer | Edit/lifecycle mutation |
| `/dashboard/events/[id]/registrants` | Organizer | Registrant list |
| `/dashboard/events/[id]/check-in` | Organizer Phase 1 | QR/manual check-in |

## Schema

All timestamps use `timestamptz`. IDs may use UUID or serial consistently; choose UUID for public SaaS portability. All fields below are required unless suffixed `?`.

| Table | Fields | Constraints |
|---|---|---|
| `users` | `id`, `email`, `name?`, `image?`, `password_hash?`, `platform_role` default `organizer`, timestamps | `email` unique; password hash nullable for OAuth-only users; platform role `organizer|platform_admin` |
| `accounts` | Auth.js adapter account fields: `user_id`, `type`, `provider`, `provider_account_id`, token fields | unique `(provider, provider_account_id)` for Google OAuth linking |
| `sessions`, `verification_tokens` | Standard Auth.js Drizzle adapter tables | Generated with adapter schema; JWT remains 8-hour session strategy |
| `workspaces` | `id`, `owner_id`, `name`, `slug`, timestamps | `owner_id` unique (one workspace/organizer); `slug` unique |
| `events` | `id`, `workspace_id`, `title`, `slug`, `description`, `date_time`, `max_quota`, `registered_count` default 0, `speaker?`, `banner_url?`, `tags?`, `status`, `created_at`, `updated_at`, `deleted_at?` | partial unique `(workspace_id,slug) WHERE deleted_at IS NULL`; status `draft|published|cancelled|completed` |
| `registrations` | `id`, `event_id`, `name`, `email`, `phone?`, `ticket_id`, `created_at`, `checked_in_at?` | unique `(event_id,email)`; `ticket_id` unique |

`tags` is comma-separated text in Phase 0. `banner_url` is URL paste in Phase 0; Supabase Storage Phase 1.

### Auth Persistence

Use `@auth/drizzle-adapter`. Credentials registration writes `users.password_hash` using bcryptjs; Google OAuth creates/links `accounts` through the adapter. First successful organizer login bootstraps one workspace atomically: name = organizer name; slug = generated organizer-name slug with unique suffix if needed.

### Registration Transaction

1. Parse shared Zod schema.
2. Atomic reserve slot:

```sql
UPDATE events
SET registered_count = registered_count + 1, updated_at = NOW()
WHERE id = $event_id
  AND status = 'published'
  AND deleted_at IS NULL
  AND registered_count < max_quota
RETURNING id;
```

3. No returned row: reject unavailable/full event.
4. Generate ticket ID; insert registration.
5. Unique email failure rolls back entire transaction, including counter.
6. `revalidatePath()` then `redirect('/success/[ticketId]')`.

`remaining = max_quota - registered_count`. Never use `COUNT(registrations)` as concurrency guard.

## Event Lifecycle

| Status | Public page | Registration | Organizer edit | Ticket |
|---|---|---|---|---|
| Draft | 404 | Closed | Full edit | N/A |
| Published | Visible | Open if quota | Full edit subject quota rule | Available |
| Cancelled | Visible with cancellation notice | Closed | Limited metadata | Available |
| Completed | Archive/read-only | Closed | Read-only | Available/read-only |

Soft-deleted events disappear from landing/public event route but e-ticket remains accessible.

## Supabase Operations

| Context | Env | Connection |
|---|---|---|
| App: local, Vercel preview, production | `DATABASE_URL` | Transaction Pooler, port 6543 |
| Drizzle migration | `DATABASE_URL_MIGRATION` | Session Pooler/direct, port 5432 |

One Supabase Free project is shared by local, preview, production. Vercel Preview is read-only: public data can be viewed, but signup, event CRUD, registration, check-in, and all writes return a preview notice. Preview uses demo/test data only. Agent A generates and commits migrations with schema PR, then manually applies migration after merge. CI and Agent B never apply migration.

## Delivery Boundaries

- **Phase 0**: public discovery, organizer auth/bootstrap, event CRUD/lifecycle, guest registration, quota, ticket, registrants.
- **Phase 1**: check-in, Storage, archive UI.
- **Phase 2**: RLS, audit, analytics, search.

Phase boundaries order delivery. They do not remove documented schema/security boundaries from the product architecture.
