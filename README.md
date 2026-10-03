# RuangAcara — UNJ Finals

SaaS reservasi webinar dan e-ticketing. Next.js 15, React 19, Bun, Tailwind CSS v4, shadcn/ui, Drizzle ORM, Supabase PostgreSQL.

## Pengembangan

1. Install Bun sesuai `packageManager` di `package.json`.
2. Jalankan `bun install --frozen-lockfile`.
3. Salin `.env.example` menjadi `.env.local`, isi koneksi Supabase dan secret auth. Jangan commit kredensial.
4. Jalankan `bun run dev`.

```bash
bun run lint
bun run typecheck
bun run build
```

## Pemeriksaan mandiri

Jalankan dari root proyek:

```bash
bun scripts/checks/auth.check.ts
bun scripts/checks/events.self-check.mjs
```

Pemeriksaan auth mencakup tujuan berdasarkan role, penolakan redirect tidak aman, konfigurasi Edge, masa berlaku JWT. Pemeriksaan lifecycle memastikan status terminal tidak membuka pendaftaran kembali.

Pemeriksaan rollback pendaftaran membutuhkan `DATABASE_URL` database uji dan `REGISTRATION_CHECK_ID` UUID pendaftaran uji yang sudah tersedia. Event harus published, belum dihapus, memiliki sisa kuota; peserta harus attendee. Pemeriksaan memakai data tersebut tanpa seed, mencoba pendaftaran duplikat bersamaan, memverifikasi kuota tidak berubah. Jangan jalankan saat ada mutasi lain pada event tersebut atau dalam mode preview.

```bash
REGISTRATION_CHECK_ID=<UUID-pendaftaran-uji> bun scripts/checks/registration.self-check.mjs
```

## Database

`DATABASE_URL` memakai Transaction Pooler port 6543. `DATABASE_URL_MIGRATION` memakai Session Pooler port 5432. Bun memuat `.env.local` untuk perintah lokal.

```bash
bun run db:generate
bun run db:migrate
```

Hanya Agent A menjalankan migrasi manual setelah schema PR merge. CI tidak menjalankan migrasi. Schema belum diterapkan ke Supabase sampai koneksi tersedia.

## Batas scaffolding

Foundation menyediakan root layout, konfigurasi shadcn/ui, schema, client database, env template, CI. Halaman publik dan shared domain utilities mengikuti ownership Agent B di `CONTRACT.md`. Auth, Server Actions, dashboard menyusul setelah dependensinya tersedia. Route `/` belum diimplementasikan.

`CONTRACT.md` adalah sumber kebenaran; perubahan contract hanya oleh human.
