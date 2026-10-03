# Frontend Implementation Guide

## State

Backend/product documentation is locked. This guide starts the **frontend design state**. UI changes must not alter product scope, schema, tenant isolation, lifecycle, or Server Action behavior without a separate decision review.

## Stitch-First Workflow

Stitch builds the first visual implementation. AI then turns the selected output into maintainable Next.js code.

1. Generate Landing, Event Detail, and E-Ticket using `docs/stitch-prompts.md`.
2. Review the three outputs before code implementation. Keep the chosen screenshots/export in `docs/design-references/`.
3. Use Stitch-exported React/CSS only as visual scaffolding. Convert it to project conventions: App Router, Tailwind v4, shadcn/ui, TypeScript, accessible semantic HTML.
4. Bind real data, loading/error states, Server Actions, and auth guards after visual conversion.
5. Compare desktop and 360px render with approved references before PR.

`docs/design.md` remains authoritative when a Stitch output conflicts with product requirements, accessibility, or the locked product boundary.

## Ownership

| Surface | Components | Owner |
|---|---|---|
| Public discovery | `event-card`, public header, landing empty state | Agent B |
| Event detail | event summary, sticky registration panel, lifecycle alerts | Agent B |
| Registration | `registration-form`, quota UI, Sonner errors | Agent B |
| Ticket | `ticket-card`, QR, print styling | Agent B |
| Dashboard | event form/table, registrant table, status actions | Agent A |

## Build Order

1. Root CSS tokens, Inter font, Sonner provider.
2. Public header and event card from approved landing reference.
3. Event detail grid from approved detail reference.
4. Registration states: available, pending, full, cancelled, completed, preview read-only.
5. Ticket card from approved ticket reference.
6. Dashboard uses shadcn density, not public Luma layout.

## Stitch Conversion Rules

| Stitch output | Required conversion |
|---|---|
| Static text/data | Typed props from Server Components or Server Actions |
| Generic buttons | shadcn `Button`, correct variants, pending/disabled behavior |
| Form visuals | Shared Zod validation, `useActionState`, labels, inline errors |
| Images | Next.js `Image` where remote config permits; gradient/initial fallback for missing banner |
| Arbitrary CSS | Tailwind v4 utilities and tokens from `design.md` |
| Fake UI states | Actual published/full/cancelled/completed/preview states |
| Unlabelled icons | Accessible labels or visible text |

Never paste a Stitch export unchanged into the app.

## Preview Read-only UI

When `VERCEL_ENV=preview`, render a top banner: "Mode pratinjau: perubahan dan pendaftaran dinonaktifkan." Disable or replace every write CTA with explanation. Server Action remains final enforcement.

## Acceptance

- Landing grid: 1/2/3 columns at mobile/md/lg.
- Detail: one column below `lg`; sticky 360px panel at `lg`+.
- No horizontal overflow at 360px.
- Keyboard/focus/error behaviors follow `design.md`.
- No copied Luma asset, logo, CSS, exact copy, or waitlist/community feature.
- Every public screen is traceable to one approved Stitch reference plus a matching section in `design.md`.
