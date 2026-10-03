# Architecture Decision Records

## ADR-0001: Next.js Fullstack Monolith

Next.js App Router handles public UI, organizer dashboard, Server Components, and Server Actions. No separate REST backend. This keeps one deployable while retaining server-only data boundaries.

## ADR-0002: Supabase PostgreSQL via Drizzle + postgres.js

Supabase is managed PostgreSQL only. Drizzle + postgres.js is the only DB access layer. No Supabase browser SDK, Auth, Storage, or RLS in Phase 0. App uses Transaction Pooler; migrations use Session Pooler/direct URL.

## ADR-0003: Multi-tenant Workspace Model

One organizer owns exactly one workspace and cannot join another workspace. Every organizer action authorizes `workspace.owner_id` from the server session before querying/mutating tenant data.

## ADR-0004: NextAuth Credentials + Google OAuth

Organizers can self-register by email/password or Google OAuth. First organizer login bootstraps one workspace from organizer name. Platform admins are email allowlisted, not a hardcoded single account.

## ADR-0005: Workspace-scoped Public URLs

Public event URL is `/w/[workspaceSlug]/events/[eventSlug]`. Event slug is unique per active workspace, not globally. This exposes organizer identity without custom domains.

## ADR-0006: Atomic registered_count Capacity

`events.registered_count` is the source of truth for capacity. Transaction atomically increments it only when below `max_quota`, then inserts registration. Any insert failure rolls back counter. This prevents overbooking.

## ADR-0007: Event Lifecycle + Soft Delete

Event status: draft, published, cancelled, completed. Cancelled closes registration; completed is archive/read-only. Soft delete hides event routes but preserves e-ticket access.

## ADR-0008: Guest Attendee, Free Events Only

Attendees register without accounts. Events are free. Payments, refunds, and attendee account history are explicitly out of scope.

## ADR-0009: Client QR Ticket + Phase 1 Check-in

`qrcode.react` renders ticket ID as SVG. Phase 1 scanner/manual input validates ticket then atomically sets `checked_in_at`; duplicate check-in does not overwrite timestamp.

## ADR-0010: Luma-inspired Public UI, shadcn Dashboard

Public pages borrow Luma's visual patterns, not proprietary code/assets: editorial event cards, large cover imagery, generous whitespace, two-column event detail, sticky registration panel. Dashboard remains dense shadcn admin UI.

## ADR-0011: Tailwind v4, date-fns, Sonner

Tailwind v4 CSS configuration, date-fns Indonesian locale, and Sonner toast are standard UI primitives. No `tailwind.config.ts`.

## ADR-0012: Free-tier Shared Supabase Operations

One Supabase Free project serves dev, Vercel Preview, and production. Preview uses only demo/test data. Agent A owns generated migration and manual post-merge application; CI never migrates shared DB.

## ADR-0013: RLS Hardening Gate

RLS is deferred only while Supabase remains server-only. Before browser Supabase client, external API, or direct data access, Phase 2 must introduce and test RLS policies.
