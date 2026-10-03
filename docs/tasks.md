# Delivery Roadmap & GitHub Workflow

## Principle

PRD/FRD/architecture describe the full product. This file orders delivery. Phase 0 is MVP, not the permanent product boundary.

## GitHub Workflow

- Branch per issue: `{type}/{issue-number}-{short-description}`.
- All PRs target `main`.
- PR gates: `bun run lint`, `bun run typecheck`, `bun run build`, Vercel Preview, one approval.
- CI never applies database migration.
- Agent A owns schema/migrations: generate and commit migration in schema PR; after merge manually run `bunx drizzle-kit migrate` with `DATABASE_URL_MIGRATION`.
- Before dependent work: pull/rebase latest `main`, run checks, then open PR.
- Preview and production share one Supabase Free project. `VERCEL_ENV=preview` makes all Server Action writes read-only; use demo/test data only.

## Phase 0 — MVP Core

| Issue | Owner | Depends | Done when |
|---|---|---|---|
| #1 Foundation + Supabase schema | Agent A | — | Next/Bun/shadcn/CI installed; multi-tenant schema migrated; env templates include two DB URLs. |
| #2 Auth + workspace bootstrap | Agent A | #1 | `/register`, `/signin`, credentials password hash (email + password only); role-based redirect (organizer → /dashboard, attendee → /tickets); first organizer login atomically creates one workspace; allowlisted platform role. |
| #3 Shared domain utilities | Agent B | #1 | Zod, ActionResult, date format, workspace/event slug, ticket ID ready. |
| #4a Schema + Server Actions + types | Agent A | #2 | CONTRACT.md implemented: all Server Actions (createEvent, updateEvent, setEventStatus, deleteEvent, checkIn, registerParticipant), shared types, auth flow. Commit to main for Agent B. |
| #4b Dashboard UI + event lifecycle | Agent A | #4a | Owner-authorized workspace CRUD; draft/published/cancelled/manual-completed rules; soft delete. |
| #5 Public discovery + event detail | Agent B | #4a | `/` grid; `/w/[workspaceSlug]/events/[eventSlug]`; desktop two-column/sticky registration panel; mobile stack. |
| #6 Attendee registration + ticket | Agent B | #5 | Attendee login required; atomic quota transaction; duplicate email rollback; ticket QR/route; PDF download; attendee dashboard /tickets. |
| #7 Registrant list | Agent A | #4b,#6 | Workspace-authorized table, empty state, ticket links. |
| #8 Integration + demo seed | Either | #1-#7 | Full flow green: sign in → create/publish → discover → register → ticket → registrants → check-in. |

### Parallel Plan

```
#1 Agent A
    ├─ #2 Agent A ─ #4a Agent A ─ #4b Agent A ─ #7 Agent A
    └─ #3 Agent B ─ #5 Agent B ─ #6 Agent B
                                       └─ #8 Either
```

**Agent B may start #3 immediately after #1 merges.**
**Agent B may start #5 after #4a merges (uses CONTRACT.md).**
**Agent B must NOT modify Agent A-owned DB/query files.**
**Rebase after #4a merges before wiring queries/actions.**

## Phase 1 — Operations

| Issue | Scope |
|---|---|
| #9 Banner upload | Supabase Storage bucket, MIME/size validation, asset cleanup. |
| #10 Archive UI | Completed event and registrant archive/read-only views. |

## Phase 2 — Hardening

| Issue | Scope |
|---|---|
| #11 RLS rollout | Policies designed/tested before browser Supabase client or external API. |
| #12 Audit log | Platform/workspace mutation audit records. |
| #13 Discovery/search | Public search/filter plus organizer analytics. |
| #14 Email confirmation | Real email via Resend/SendGrid. |
| #15 Ticket types + payment | VIP/paid tickets with payment integration. |

## MVP Cutline

If time ends after #6, app still has organizer auth, event creation/publication, Luma-style public registration, correct quota, e-ticket with PDF download, and check-in. #7/#8 complete operational confidence; Phase 1/2 remain planned product features.

## Hackathon Scope (4 hours)

**Must-have**:
- Auth organizer + attendee (credentials only: email + password, role-based redirect)
- Event CRUD + lifecycle
- Public discovery + event detail
- Attendee registration + quota + ticket + PDF download
- Attendee dashboard (/tickets)
- Check-in (QR/manual)
- Registrant list

**Nice-to-have** (skip if time runs out):
- Banner upload
- Archive UI
- Dashboard settings
- Search/filter
