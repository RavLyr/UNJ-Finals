# PRD — SaaS Reservasi Webinar & E-Ticketing

## Objective

Membangun platform SaaS gratis bagi organizer untuk membuat dan menerbitkan webinar, menerima registrasi peserta tanpa akun, mengelola kapasitas secara aman, menerbitkan e-ticket QR, dan memverifikasi kehadiran.

Produk bukan lagi aplikasi satu komunitas. Setiap organizer memiliki satu workspace yang terisolasi secara aplikasi, event sendiri, peserta sendiri, dan URL publik sendiri.

## Personas

| Persona | Tujuan |
|---|---|
| Pengunjung | Menemukan event published dan melihat detailnya. |
| Peserta | Mendaftar sebagai guest, menerima serta membuka kembali e-ticket. |
| Organizer | Membuat satu workspace, event, dan mengelola peserta workspace sendiri. |
| Platform admin | Mengawasi platform via email allowlist. Tidak mengelola event organizer sehari-hari. |

## Product Scope

### Phase 0 — MVP Core

- Auth organizer self-service: register email/password dan Google OAuth.
- Auto-create satu workspace untuk organizer baru.
- Workspace otomatis dibuat dari nama organizer saat signup/first Google login.
- Platform admin via `PLATFORM_ADMIN_EMAILS` allowlist.
- Landing Luma-inspired menampilkan event published lintas workspace.
- Public URL: `/w/[workspaceSlug]/events/[eventSlug]`.
- Event gratis: draft, published, cancelled, completed.
- CRUD event: judul, deskripsi, waktu, speaker, banner URL, kategori/tag, kuota.
- Guest registration: nama, email unik per event, telepon opsional.
- Kuota aman: `registered_count` di-increment atomically dalam transaction.
- E-ticket permanen: ticket ID, QR code, detail peserta/event.
- Organizer dashboard: event CRUD dan daftar registrant.

### Phase 1 — Operations

- QR scan/check-in organizer: validasi ticket, mark `checked_in_at`, cegah check-in ganda.
- Supabase Storage untuk banner upload, validasi file, cleanup asset.
- Archive read-only untuk event `completed`, registrant, dan e-ticket.

### Phase 2 — Platform Hardening

- Supabase RLS sebelum browser Supabase client, external API, atau direct data access diperkenalkan.
- Audit log platform/workspace.
- Organizer self-service team management yang lengkap.
- Search/filter public event dan analytics organizer.

## Explicitly Out of Scope

- Paid tickets, payment gateway, refund, settlement.
- Attendee account/login.
- Email confirmation/reminder automation.
- Custom domains.
- Multi-workspace per organizer.

## User Stories

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-01 | Sebagai pengunjung, saya melihat event published. | Landing hanya menampilkan event published/non-deleted; card menuju public URL event. |
| US-02 | Sebagai peserta, saya mendaftar tanpa akun. | Nama/email valid; email hanya sekali per event; form menolak event cancelled/completed/full. |
| US-03 | Sebagai peserta, saya melihat kuota akurat. | Sisa = `max_quota - registered_count`; tidak pernah overbook saat concurrent submit. |
| US-04 | Sebagai peserta, saya menerima e-ticket. | Redirect setelah registrasi; QR memuat ticket ID; URL ticket dapat dibuka ulang. |
| US-05 | Sebagai organizer, saya membuat akun/sign in. | Register credentials atau Google OAuth; workspace nama/slug dibuat dari nama organizer saat first login. |
| US-06 | Sebagai organizer, saya membuat/edit/publish event di workspace saya. | Semua mutation memastikan `workspace.owner_id` dari session; draft tidak publik. |
| US-07 | Sebagai organizer, saya membatalkan/menyelesaikan event. | Cancelled menutup registrasi; organizer manual menandai completed; completed read-only/archive; ticket lama tetap tersedia. |
| US-08 | Sebagai organizer, saya melihat peserta event saya. | Tidak dapat melihat data workspace lain. |
| US-09 | Sebagai organizer Phase 1, saya check-in ticket QR. | Ticket valid ditandai check-in sekali; invalid/duplicate diberi error. |
| US-10 | Sebagai platform admin, saya mengawasi tenant. | Allowlisted email punya role platform admin; capability dashboard detail Phase 2. |

## Success Metrics

| Metric | Target |
|---|---|
| Registration completion | Valid submission menghasilkan e-ticket 100%. |
| Capacity correctness | Tidak ada `registered_count > max_quota`. |
| Tenant isolation | Organizer tidak bisa read/write event atau registrant workspace lain. |
| Ticket continuity | Ticket tetap public setelah event cancelled/completed/soft-deleted. |
| MVP readiness | Phase 0 end-to-end flow hijau di CI dan Vercel Preview. |
