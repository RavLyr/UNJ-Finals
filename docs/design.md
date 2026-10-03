# Design Tokens — Sistem Reservasi Webinar & E-Ticketing

Design tokens berbasis **shadcn/ui defaults** dengan **Tailwind CSS v4** (CSS-based config).

**Penting**: Tailwind v4 tidak menggunakan `tailwind.config.ts`. Semua konfigurasi ada di CSS file via `@theme` directive. shadcn/ui CSS variables didefinisikan di root CSS (`app.css` atau `globals.css`).

## Visual Direction: Luma-Inspired, Not Luma Copy

Adopt patterns observed from Luma: editorial whitespace, large event imagery, concise metadata, sharp hierarchy, event detail two-column desktop, sticky RSVP panel. Do not copy Luma CSS, assets, branding, wording, or exact layouts.

| Surface | Direction |
|---|---|
| Public pages | Warm near-white canvas, sparse chrome, image-led event cards, large bold headings, muted metadata. |
| Dashboard | Dense operational shadcn UI: table, filters, dialogs, clear status chips. |
| Accent | Banner imagery supplies personality. Product chrome remains mostly neutral. |
| Motion | Short opacity/translate hover only; no decorative animation. |

### Non-negotiable Rules

1. Public UI must feel editorial and event-first, not like a generic SaaS dashboard.
2. Event imagery owns color/personality; interface chrome stays neutral.
3. One primary action per public screen: explore, register, or view ticket.
4. Use real Indonesian product copy. Never use placeholder lorem ipsum in production UI.
5. Do not recreate Luma's wordmark, logo, proprietary illustrations, copy, CSS, or exact pixel layout.

### Design Anti-patterns

- Gradient hero backgrounds, glassmorphism, neon accents, dashboard stat cards on public pages.
- More than one primary-color button inside a single public card.
- Icon-only controls without accessible label.
- Decorative blobs, excessive pill badges, or dense border grids.
- Cover image as a tiny thumbnail on event detail.

## Content Model For Mockups

Use this consistent demo data in every visual reference:

| Field | Value |
|---|---|
| Product | RuangAcara |
| Workspace | Komunitas Teknologi Indonesia |
| Event | Merancang Produk AI yang Bertahan Lama |
| Date | Sabtu, 18 Oktober 2026 · 19.00 WIB |
| Speaker | Nadya Prameswari |
| Capacity | 42 dari 100 kursi tersedia |
| Ticket ID | `WBN-20261018-K7M2` |

## Interaction & State Matrix

| Surface | Default | Hover/focus | Loading | Empty/error |
|---|---|---|---|---|
| Event card | Cover, date, title, speaker | `shadow-md`, title underline optional | N/A | Landing empty state |
| Register button | Solid primary | Darken 8%, visible focus ring | Disabled, spinner, "Mendaftarkan..." | Sonner error, form data preserved |
| Registration panel | Quota + fields + CTA | Input ring on focus | Fields unchanged, CTA pending | Full/cancelled/completed alert replaces form |
| Ticket | Read-only card | Print-safe; no hover needed | Skeleton only during route transition | 404 ticket state |
| Dashboard row | Compact table row | Accent background | Inline action pending | Empty workspace-event state |

## Accessibility Requirements

- Public heading order: one `h1`, then sections `h2`.
- Event card is one semantic link. No nested buttons/links.
- Cover images: descriptive alt with event title; decorative fallback has empty alt.
- Form error uses `aria-describedby`; first invalid field receives focus after submit.
- Sticky registration panel must remain in natural DOM order after event summary.
- All color states also include text/icon, never color alone.
- QR code has visible ticket ID text and `aria-label`.

## Implementation Recipes

### Public Container

```tsx
<main className="mx-auto w-full max-w-[1200px] px-5 py-12 md:px-8 md:py-20">
  {children}
</main>
```

### Event Detail Grid

```tsx
<div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
  <article>{eventInformation}</article>
  <aside className="lg:sticky lg:top-20 lg:self-start">{registrationPanel}</aside>
</div>
```

### Public Event Card

```tsx
<Link className="group overflow-hidden rounded-[14px] border bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
  <div className="aspect-video bg-muted">{coverOrFallback}</div>
  <div className="space-y-2 p-4">{metadataAndTitle}</div>
</Link>
```

## Stitch Handoff

Stitch is used only to make visual references for review. `docs/design.md` remains the implementation source of truth; a Stitch screen does not override requirements, route behavior, accessibility, or tokens. See `docs/stitch-prompts.md`.

## Locked Product Boundary

The following decisions are locked for frontend work: multi-organizer SaaS, one owner-only workspace per organizer, self-service organizer signup, free guest registration, workspace-scoped public URL, manual event completion, Supabase server-only access, and Vercel Preview read-only mode.

Frontend work may refine presentation, layout, component states, and responsive behavior. It must not introduce attendee accounts, team/member UI, paid tickets, direct Supabase browser access, writable preview behavior, or Luma code/assets without an explicit product decision.

## Public Layout Spec

### Global Header

- Height: 64px desktop/mobile.
- Content max width: 1200px, horizontal padding 20px mobile / 32px desktop.
- Left: wordmark "RuangAcara" (temporary product name; replace only globally).
- Right: `Jelajahi Event`, `Masuk sebagai organizer`.
- Bottom border only after scroll or on dense surfaces; otherwise transparent.

### Landing `/`

- Container: max-width 1200px; `py-12 md:py-20`.
- Hero: eyebrow "EVENT ONLINE"; heading 48px desktop/32px mobile; one muted sentence.
- Section heading: "Event mendatang" with published event count optional.
- Grid: 1 column mobile, 2 columns `md`, 3 columns `lg`; gap 20px.
- Empty state: centered compact card, no illustration required.

### Event Card

- Card border radius: 14px, overflow hidden, white background, `shadow-sm` only on hover.
- Cover: 16:9 ratio (`aspect-video`), `object-cover`; missing URL uses neutral radial gradient with workspace initial.
- Body: 16px padding.
- Metadata order: date/time, title, speaker, remaining quota.
- Title max 2 lines; speaker max 1 line; never force equal card heights through fixed content clipping.
- Entire card is one accessible link.

### Public Event Detail `/w/[workspaceSlug]/events/[eventSlug]`

- Container: max-width 1120px, `py-8 md:py-12`.
- Cover image: full-width 16:7 desktop / 16:9 mobile, 16px radius.
- Main grid at `lg`: `minmax(0, 1fr) 360px`, 48px gap.
- Left: workspace name, title, date/time, speaker, tags, description.
- Right: `sticky top-20` registration card; on smaller screens it moves below summary and is not sticky.
- Registration card: quota first, then form CTA. Cancelled/completed/full replace form with specific alert.
- No maps, follow buttons, social graph, community calendar, attendee social features.

### E-Ticket `/success/[ticketId]`

- Centered 480px max card, not a dashboard layout.
- Header: success eyebrow and event title.
- QR centered; ticket ID in monospace below.
- Participant/event details use definition-list rows, not a table.
- Ticket remains deliberately plain and printable.

### Dashboard

- Max width 1280px, compact 24px vertical rhythm.
- Desktop left nav optional only after more than three dashboard sections; Phase 0 top nav is enough.
- Event table is the primary surface. No marketing hero, cover-heavy layout, or sticky panel.
- Status chips: draft neutral, published green, cancelled red, completed slate.

---

## 1. Core Tokens

### 1.1 Color Palette

Berbasis shadcn/ui CSS custom properties (HSL). Mode: **light only** (dark mode tidak di-scope MVP).

| Token | HSL Value | Hex (approx) | Penggunaan |
|---|---|---|---|
| `--background` | `0 0% 100%` | `#FFFFFF` | Background halaman |
| `--foreground` | `240 10% 3.9%` | `#0A0A0B` | Teks utama |
| `--card` | `0 0% 100%` | `#FFFFFF` | Background card |
| `--card-foreground` | `240 10% 3.9%` | `#0A0A0B` | Teks di card |
| `--primary` | `240 5.9% 10%` | `#18181B` | Button primary, link aktif |
| `--primary-foreground` | `0 0% 98%` | `#FAFAFA` | Teks di atas primary |
| `--secondary` | `240 4.8% 95.9%` | `#F4F4F5` | Background secondary, badge inactive |
| `--secondary-foreground` | `240 5.9% 10%` | `#18181B` | Teks secondary |
| `--muted` | `240 4.8% 95.9%` | `#F4F4F5` | Background muted, placeholder |
| `--muted-foreground` | `240 3.8% 46.1%` | `#71717A` | Teks muted (hint, caption) |
| `--accent` | `240 4.8% 95.9%` | `#F4F4F5` | Hover background |
| `--accent-foreground` | `240 5.9% 10%` | `#18181B` | Teks accent |
| `--destructive` | `0 84.2% 60.2%` | `#EF4444` | Tombol hapus, error state |
| `--destructive-foreground` | `0 0% 98%` | `#FAFAFA` | Teks di atas destructive |
| `--border` | `240 5.9% 90%` | `#E4E4E7` | Border input, card, tabel |
| `--input` | `240 5.9% 90%` | `#E4E4E7` | Border input field |
| `--ring` | `240 5.9% 10%` | `#18181B` | Focus ring |

### Semantic Colors (Custom)

| Token | Tailwind Class | Penggunaan |
|---|---|---|
| Success | `text-green-600` / `bg-green-50` | Kuota tersedia, registrasi berhasil |
| Warning | `text-amber-600` / `bg-amber-50` | Kuota hampir habis (≤ 20%) |
| Error | `text-red-600` / `bg-red-50` | Kuota penuh, validasi error, destructive action |
| Info | `text-blue-600` / `bg-blue-50` | Informasi umum, tooltip |

### 1.2 Typography

| Token | Value | Penggunaan |
|---|---|---|
| Font Family | `Inter, system-ui, sans-serif` | Semua teks. Load via `next/font/google`. |
| Font Size `xs` | `0.75rem` (12px) | Caption, helper text |
| Font Size `sm` | `0.875rem` (14px) | Body secondary, table cell, badge |
| Font Size `base` | `1rem` (16px) | Body text, form input |
| Font Size `lg` | `1.125rem` (18px) | Subheading |
| Font Size `xl` | `1.25rem` (20px) | Card title |
| Font Size `2xl` | `1.5rem` (24px) | Page heading |
| Font Size `3xl` | `1.875rem` (30px) | Hero heading (event title) |
| Font Weight `normal` | `400` | Body text |
| Font Weight `medium` | `500` | Label, table header |
| Font Weight `semibold` | `600` | Subheading, button |
| Font Weight `bold` | `700` | Page heading, ticket ID |
| Line Height `tight` | `1.25` | Heading |
| Line Height `normal` | `1.5` | Body text |
| Line Height `relaxed` | `1.75` | Deskripsi panjang |

### 1.3 Spacing

Skala 4px-based (Tailwind default):

| Token | Value | Usage |
|---|---|---|
| `1` | `0.25rem` (4px) | Micro spacing |
| `2` | `0.5rem` (8px) | Gap antar elemen inline |
| `3` | `0.75rem` (12px) | Padding card internal |
| `4` | `1rem` (16px) | Default padding, gap |
| `6` | `1.5rem` (24px) | Section spacing |
| `8` | `2rem` (32px) | Card padding, form gap |
| `12` | `3rem` (48px) | Page section gap |
| `16` | `4rem` (64px) | Hero spacing |

### 1.4 Border Radius

| Token | Value | Penggunaan |
|---|---|---|
| `--radius` (base) | `0.5rem` (8px) | Card, dialog |
| `radius-sm` | `calc(var(--radius) - 4px)` = 4px | Badge, small elements |
| `radius-md` | `calc(var(--radius) - 2px)` = 6px | Input, button |
| `radius-lg` | `var(--radius)` = 8px | Card, container |
| `radius-full` | `9999px` | Avatar, circular badge |

### 1.5 Shadows

| Token | Value | Penggunaan |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation (input focus) |
| `shadow` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Card default |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Card hover, dropdown |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modal, dialog |

### 1.6 Breakpoints

| Token | Min-width | Penggunaan |
|---|---|---|
| `sm` | `640px` | Mobile landscape |
| `md` | `768px` | Tablet |
| `lg` | `1024px` | Desktop |
| `xl` | `1280px` | Wide desktop |

---

## 2. Component Tokens

### 2.1 Button

| Variant | Background | Foreground | Border | Hover |
|---|---|---|---|---|
| `default` | `primary` | `primary-foreground` | none | `primary/90` |
| `destructive` | `destructive` | `destructive-foreground` | none | `destructive/90` |
| `outline` | transparent | `foreground` | `border` | `accent` bg |
| `secondary` | `secondary` | `secondary-foreground` | none | `secondary/80` |
| `ghost` | transparent | `foreground` | none | `accent` bg |
| `link` | transparent | `primary` | none | underline |

| Size | Height | Padding X | Font Size |
|---|---|---|---|
| `sm` | `2rem` (32px) | `0.75rem` | `sm` (14px) |
| `default` | `2.5rem` (40px) | `1rem` | `sm` (14px) |
| `lg` | `2.75rem` (44px) | `2rem` | `base` (16px) |

Penggunaan:
- **default**: "Daftar Sekarang", "Simpan", "Buat Event"
- **destructive**: "Hapus Event"
- **outline**: "Batal", "Kembali"
- **ghost**: icon buttons, toggle
- **link**: inline links

### 2.2 Card

| Property | Value |
|---|---|
| Background | `card` (`#FFFFFF`) |
| Border | `1px solid var(--border)` |
| Border Radius | `radius-lg` (8px) |
| Shadow | `shadow` |
| Padding | `1.5rem` (24px) |
| Hover Shadow | `shadow-md` (opsional, hanya card yang clickable) |

Penggunaan:
- E-ticket card di halaman success
- Event detail card
- Form container

### 2.3 Form Input

| State | Border | Background | Ring |
|---|---|---|---|
| Default | `input` color | `background` | none |
| Focus | `ring` color | `background` | `2px ring` |
| Error | `destructive` color | `background` | `2px destructive ring` |
| Disabled | `input` color | `muted` | none |

| Property | Value |
|---|---|
| Height | `2.5rem` (40px) |
| Padding X | `0.75rem` (12px) |
| Font Size | `sm` (14px) |
| Border Radius | `radius-md` (6px) |
| Placeholder Color | `muted-foreground` |

Error message:
- Font size: `xs` (12px)
- Color: `destructive` (`#EF4444`)
- Margin top: `0.25rem` (4px)

### 2.4 Badge

| Variant | Background | Foreground | Penggunaan |
|---|---|---|---|
| `default` | `primary` | `primary-foreground` | Default |
| `secondary` | `secondary` | `secondary-foreground` | Draft status |
| `success` (custom) | `bg-green-100` | `text-green-800` | Published status |
| `destructive` | `bg-red-100` | `text-red-800` | Kuota penuh |
| `warning` (custom) | `bg-amber-100` | `text-amber-800` | Kuota hampir habis |

| Property | Value |
|---|---|
| Font Size | `xs` (12px) |
| Font Weight | `medium` (500) |
| Padding | `0.125rem 0.5rem` (2px 8px) |
| Border Radius | `radius-full` (9999px) |

### 2.5 Table

| Property | Value |
|---|---|
| Header Background | `muted` |
| Header Font Weight | `medium` (500) |
| Row Border | `1px solid var(--border)` bottom |
| Cell Padding | `0.75rem 1rem` (12px 16px) |
| Hover Row | `accent` background |

Penggunaan: tabel event di admin dashboard, tabel registrant.

### 2.6 Toast / Alert

| Variant | Background | Border (left) | Icon |
|---|---|---|---|
| Success | `bg-green-50` | `4px solid green-500` | ✓ |
| Error | `bg-red-50` | `4px solid red-500` | ✕ |
| Warning | `bg-amber-50` | `4px solid amber-500` | ⚠ |
| Info | `bg-blue-50` | `4px solid blue-500` | ℹ |

Penggunaan:
- Success: (jarang — biasanya redirect)
- Error: "Email sudah terdaftar", "Kuota sudah habis"
- Warning: (reserved)
- Info: (reserved)

### 2.7 Quota Banner (Kuota Penuh)

| Property | Value |
|---|---|
| Background | `bg-red-50` |
| Border | `1px solid` `border-red-200` |
| Text Color | `text-red-800` |
| Padding | `1rem 1.5rem` (16px 24px) |
| Border Radius | `radius-lg` (8px) |
| Font Size | `base` (16px) |
| Font Weight | `medium` (500) |

### 2.8 E-Ticket Card

| Property | Value |
|---|---|
| Background | `card` (`#FFFFFF`) |
| Border | `1px solid var(--border)` |
| Shadow | `shadow-md` |
| Max Width | `480px` (desktop centered) |
| Padding | `2rem` (32px) |
| QR Code Size | `200px` × `200px` |
| Ticket ID Font | `bold`, `xl` (20px), `font-mono` |
| Data Labels | `text-muted-foreground`, `sm` (14px) |
| Data Values | `text-foreground`, `base` (16px) |
