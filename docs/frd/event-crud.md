# FRD: Workspace Event Management

## Authorization

Semua dashboard route dan action memerlukan session organizer. Server mengambil user dari session lalu memastikan `event.workspace_id` dimiliki user (`workspace.owner_id = session.user.id`). Jangan menerima `workspace_id` dari form sebagai authorization proof.

## Routes

| Route | Purpose |
|---|---|
| `/dashboard` | Event list untuk workspace user |
| `/dashboard/events/new` | Create event |
| `/dashboard/events/[id]/edit` | Edit/lifecycle event |
| `/w/[workspaceSlug]/events/[eventSlug]` | Public event page |

## Fields

| Field | Rule |
|---|---|
| Title | 5-200 chars |
| Event slug | Generated from title; unique within active workspace events |
| Description | 10-5000 chars, plain text Phase 0 |
| Date/time | Future `timestamptz` when creating/publishing |
| Max quota | Integer 1-10,000; cannot be lower than `registered_count` |
| Speaker | Optional, max 200 chars |
| Banner URL | Optional valid HTTPS URL; Storage upload Phase 1 |
| Tags | Optional comma-separated, max 5 tags |
| Status | `draft`, `published`, `cancelled`, `completed` |

## Lifecycle

| Transition | Rule |
|---|---|
| Create → draft | Default |
| Draft → published | All required fields valid |
| Published → cancelled | Close registration; show cancellation notice; ticket remains public |
| Published → completed | Organizer menjalankan action manual; close registration; archive/read-only public/dashboard detail |
| Any active → soft deleted | Set `deleted_at`; public page 404; ticket remains public |

## Actions

| Action | Server behavior |
|---|---|
| `createEvent` | Authorize workspace owner, attach session workspace ID, validate, create draft, redirect dashboard |
| `updateEvent` | Authorize event workspace, validate full replacement, reject quota below `registered_count` |
| `setEventStatus` | Authorize, validate lifecycle transition, revalidate public/dashboard paths |
| `deleteEvent` | Authorize, set `deleted_at`, preserve registrations/tickets |

## Query Rules

- Public listing: `published` + `deleted_at IS NULL` only.
- Public detail: `published`, `cancelled`, or `completed` + `deleted_at IS NULL`; draft returns 404.
- Dashboard: current workspace events only; completed shown as archive/read-only.
- Event slug lookup always combines `workspace.slug` + `event.slug`.
