# AGENTS.md

## Agent Enforcement Rules (MANDATORY)

1. **Wajib baca `CONTRACT.md` sebelum mulai work.** CONTRACT.md adalah single source of truth untuk schema, Server Actions, routes, types, auth, quota, ticket, token, notif, PDF, dan cancel flow.
2. **Agent tidak boleh buat product/technical decision sendiri.** Kalau ada hal yang perlu dipertanyakan atau blocked, berhenti dan tanya ke human (orchestrator) via issue comment.
3. **Agent read-only CONTRACT.md.** Perubahan CONTRACT.md hanya oleh human. Kalau agent perlu perubahan, buat issue comment, human update, agent lanjut.
4. **Agent tidak boleh ngarang atau mock data** untuk mengisi gap yang tidak ada di CONTRACT.md. Kalau CONTRACT.md tidak jelas, tanya.
5. **Agent wajib berhenti kalau blocked** oleh dependency yang belum selesai (misal Agent B butuh #4a dari Agent A). Jangan guess atau workaround.

## User Roles

| Role | Description | Dashboard |
|---|---|---|
| **organizer** | Membuat event, mengelola peserta, check-in | `/dashboard` |
| **attendee** | Register event, lihat tiket, download PDF | `/tickets` |
| **platform_admin** | Mengawasi platform (Phase 2) | `/admin` |

**Semua user (organizer + attendee) pakai auth flow yang sama.** Login → cek role → redirect sesuai role.

## Project

SaaS Reservasi Webinar & E-Ticketing — multi-tenant Next.js 15 fullstack, Supabase PostgreSQL, Drizzle ORM, Bun.

## Commands

```bash
bun install                      # install dependencies
bun run dev                      # dev server (http://localhost:3000)
bun run build                    # production build
bun run lint                     # ESLint
bun run typecheck                # tsc --noEmit
bunx drizzle-kit generate        # generate migration from schema changes
bunx drizzle-kit migrate         # apply migrations to DB
bunx drizzle-kit studio          # Drizzle Studio (DB GUI)
```

## Stack & Key Libraries

- **Runtime/PM**: Bun (lockfile: `bun.lock`, NOT package-lock.json)
- **Framework**: Next.js 15, App Router, Server Components, Server Actions
- **ORM**: Drizzle ORM (NOT Prisma) — schema in `src/server/db/schema.ts`, SQL-like API, no codegen step
- **DB Driver**: `postgres` (postgres.js) — NOT `pg` (node-postgres)
- **Database**: Supabase (managed PostgreSQL) — NOT local PostgreSQL
- **Auth**: NextAuth.js v5 + `@auth/drizzle-adapter` — credentials only (email + password); organizer workspace bootstrap
- **UI**: shadcn/ui + Tailwind CSS v4 (CSS-based config, no `tailwind.config.ts`)
- **Validation**: Zod — shared schemas in `src/lib/validations.ts` (client + server)
- **QR**: qrcode.react — client-side SVG, used in `src/components/ticket-card.tsx`
- **Date**: date-fns + locale `id` — format tanggal Bahasa Indonesia
- **Toast**: Sonner (via shadcn/ui)

## Architecture Rules

- **No separate API routes for CRUD.** Use Server Actions (`"use server"`) for mutations, Server Components for data fetching.
- **Tenant authorization**: derive session user server-side, verify `workspace.owner_id = user.id` before every organizer query/mutation. Never trust browser workspace IDs.
- **Database transactions** for registration: atomic increment `registered_count` only when `< max_quota`, then insert registration. Unique email failure must rollback counter.
- **Soft delete** for events (`deleted_at` column). All queries must filter `WHERE deleted_at IS NULL`.
- **Ticket ID format**: `WBN-YYYYMMDD-XXXX` (generated server-side in `src/lib/ticket-id.ts`).
- **Public events**: Landing `/` lists published events; event URL is `/w/[workspaceSlug]/events/[eventSlug]`.
- **Lifecycle**: `draft`, `published`, `cancelled`, `completed`; only published accepts registrations.
- **All timestamps**: `timestamptz` (UTC in DB, display as WIB in UI).
- **Server Action return type**: `ActionResult<T>` defined in `src/lib/types.ts`.
- **Form pattern**: React 19 `useActionState()` for all forms.
- **Redirect after mutation**: Use `redirect()` from `next/navigation` inside Server Action (throws internally).
- **Slug uniqueness**: Partial unique index `WHERE deleted_at IS NULL` — slug reusable after soft delete.

## Database (Supabase)

- **Supabase project** harus sudah dibuat sebelum mulai coding
- **Connection string**: gunakan Transaction Pooler (port 6543) untuk app, Session Pooler (port 5432) untuk migrasi
- **Connection envs**: `DATABASE_URL` untuk app; `DATABASE_URL_MIGRATION` untuk Drizzle migration. Never expose either to browser.
- **Migrasi**: hanya Agent A. Generate + commit migration bersama schema PR; setelah merge jalankan `bunx drizzle-kit migrate`. CI dan Agent B tidak menjalankan migration.
- **Free tier policy**: satu project untuk dev, Vercel Preview, production. Preview data harus data demo/test, bukan data pribadi nyata.
- **No Supabase client/RLS MVP**: Drizzle server-only. Jangan install `@supabase/supabase-js`.
- **Schema**: definisi lengkap ada di `docs/architecture.md` section 4 — copy langsung ke `src/server/db/schema.ts`

## Directory Layout

```
src/
  app/                    # Next.js routes
    page.tsx              # Landing page: list published events (Luma-style)
    w/[workspaceSlug]/events/[eventSlug]/ # Public: detail + registration
    tickets/              # Protected: attendee ticket list + detail
    dashboard/            # Protected: organizer event CRUD, registrant list
    settings/             # Protected: profile settings (organizer + attendee)
    api/auth/             # NextAuth route handler
  components/
    ui/                   # shadcn/ui primitives
    registration-form.tsx # Client component
    ticket-card.tsx       # Client component (QR code)
    event-form.tsx        # Client component (admin create/edit)
  server/
    db/schema.ts          # Drizzle schema (events, registrations)
    db/index.ts           # Drizzle client
    actions/              # Server Actions (register.ts, events.ts)
    queries/              # Read-only query functions
  lib/
    auth.ts               # NextAuth config (organizer + attendee)
    validations.ts        # Zod schemas (shared)
    ticket-id.ts          # Ticket ID generator
    types.ts              # ActionResult<T>, shared types
    format-date.ts        # date-fns formatters (WIB display)
    slug.ts               # generateSlug(title)
  middleware.ts           # Auth middleware: protect /dashboard/* and /tickets/*
```

## Conventions

- **UI language**: Bahasa Indonesia (all user-facing text)
- **Code language**: English (variables, functions, comments)
- **Slug**: event slug unique per workspace; public route includes workspace slug
- **Email uniqueness**: per event, enforced at DB level (composite unique `event_id + email`)
- **Quota display**: "Sisa kuota: X dari Y" — when 0, hide form and show "Kuota Penuh" banner
- **revalidatePath()** after every mutation (registration, event CRUD)

## GitHub Workflow

- **Branching**: Single branch — all PRs merge to `main`
- **Branch naming**: `{type}/{task-number}-{short-description}` (e.g., `feat/3.4-event-form-component`)
- **CI**: GitHub Actions — `lint → typecheck → build` on every PR (~1-2 min)
- **Preview deploys**: Vercel auto-deploy per PR — team reviews via preview URL
- **Labels**: `feature`, `bug`, `setup`, `chore`, `docs` + `P0`/`P1`/`P2` + `US-01`..`US-09`
- **Merge**: CI green + 1 approval → merge to `main`

## Environment Variables

```
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
DATABASE_URL_MIGRATION=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_URL=http://localhost:3000
PLATFORM_ADMIN_EMAILS=admin@example.com
```

## Docs

See `docs/` for full documentation:
- `prd.md` — Product Requirements
- `frd/` — Functional Requirements (1 file per feature):
  - `registration.md` — form, validation, race condition
  - `quota.md` — dynamic quota, kuota penuh state
  - `e-ticket.md` — success page, ticket ID, QR code
  - `event-crud.md` — admin CRUD, slug, soft delete
  - `organizer-auth.md` — credentials/Google OAuth, workspace bootstrap
  - `registrant-list.md` — workspace-scoped registrant table
  - `check-in.md` — Phase 1 QR/manual attendance
  - `non-functional.md` — NFR (responsif, security, a11y, bahasa)
- `architecture.md` — Architecture, schema, data flows
- `decision.md` — SaaS architecture decisions
- `design.md` — Luma-inspired visual spec + tokens
- `tasks.md` — phased roadmap, 2-AI-agent MVP plan, CI, merge order

See `CONTEXT.md` for domain glossary.
