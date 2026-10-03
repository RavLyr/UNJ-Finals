# FRD: Organizer Auth & Workspace Bootstrap

## Scope

NextAuth.js v5 menyediakan self-service register/login organizer melalui Credentials dan Google OAuth. Peserta tidak memiliki akun.

## Data Model

| Entity | Required fields |
|---|---|
| `users` | `id`, `email` unique, `name?`, `image?`, `password_hash?`, `platform_role`, timestamps |
| `accounts` | Auth.js adapter records for Google OAuth linking |
| `sessions`, `verification_tokens` | Standard Auth.js Drizzle adapter tables |
| `workspaces` | `id`, `owner_id`, `name`, `slug` unique, timestamps |

Satu organizer mempunyai tepat satu workspace. Organizer tidak dapat bergabung ke workspace lain. Signup/Google first login membuat user dan workspace atomically.

## Providers

| Provider | Requirement |
|---|---|
| Credentials | Email + bcryptjs password hash in `users.password_hash`; organizer registration route creates user then workspace bootstrap. |
| Google | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`; email verified dari Google. |

Use `@auth/drizzle-adapter`; JWT session lasts 8 hours. Jangan menggunakan hardcoded single admin credential sebagai auth organizer.

## Registration & Bootstrap

`/register` meminta nama, email, password, konfirmasi password. Setelah valid: buat user bcrypt hash, buat workspace dengan nama user dan slug hasil `generateSlug(user.name)`, lalu commit dalam satu transaction. Google first login memakai profile name; jika kosong, pakai prefix email.

## Authorization

- Semua `/dashboard/**` memerlukan authenticated user.
- Semua organizer query/action menerima workspace context dari server session, bukan URL saja.
- Authorization rule: `workspaces.owner_id = session.user.id`.
- `PLATFORM_ADMIN_EMAILS` comma-separated allowlist menetapkan `platform_role = platform_admin` saat sign-in. Ini tidak memberi akses otomatis ke data tenant tanpa capability eksplisit.

## Workspace URL

`/w/[workspaceSlug]/events/[eventSlug]`

Event slug unik **di dalam workspace**. Database constraint: unique `(workspace_id, slug)` untuk event aktif (`deleted_at IS NULL`).
