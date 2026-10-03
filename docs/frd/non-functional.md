# FRD: Non-Functional Requirements

Persyaratan non-fungsional yang berlaku lintas fitur.

---

## NFR-01: Responsif

UI berfungsi di mobile (360px+) dan desktop (1280px+).

| Breakpoint | Lebar | Target |
|---|---|---|
| Mobile | 360px – 639px | Single column, full-width cards, stacked form |
| Tablet | 640px – 1023px | Flexible grid, sidebar collapse |
| Desktop | 1024px+ | Full layout, sidebar visible |

Implementasi via Tailwind responsive prefixes (`sm:`, `md:`, `lg:`). Tidak perlu fine-tune pixel-perfect di semua viewport — **fokus fungsionalitas**, bukan polish (scope cut MVP).

---

## NFR-02: Performa

Halaman event load < 2 detik di lokal (tanpa network latency signifikan).

| Strategi | Detail |
|---|---|
| Server Components | Data di-fetch server-side, zero client-side fetch waterfall |
| No client-side state library | Tidak ada Redux/Zustand bundle |
| shadcn/ui tree-shaking | Hanya import komponen yang dipakai |
| Image | Banner event via URL (no upload/processing server-side) |

Tidak perlu performance monitoring, Lighthouse audit, atau CDN di MVP.

---

## NFR-03: Aksesibilitas Dasar

Target: WCAG 2.1 Level A (minimal).

| Aspek | Implementasi |
|---|---|
| Form labels | Setiap `<input>` punya `<label>` terasosiasi via `htmlFor` |
| Error messages | Terasosiasi via `aria-describedby` ke field yang error |
| Focus management | Setelah submit error, fokus ke field pertama yang error |
| Keyboard | Tab order mengikuti visual order. Enter submit form. |
| Color contrast | Minimum 4.5:1 — shadcn/ui defaults sudah memenuhi |
| QR code | `aria-label` deskriptif: "QR Code untuk ticket WBN-..." |

---

## NFR-04: Keamanan

| Risiko | Mitigasi | Detail |
|---|---|---|
| SQL Injection | Drizzle ORM | Parameterized queries, tidak ada raw string concatenation |
| CSRF | Server Actions | Built-in CSRF token di Next.js Server Actions |
| XSS | React | Auto-escape output. Tidak ada `dangerouslySetInnerHTML`. |
| Organizer route exposure | Middleware | `src/middleware.ts` cek session, redirect ke login |
| Preview write safety | `VERCEL_ENV=preview` mutation guard | Semua Server Actions write return preview notice; preview tidak menulis shared DB |
| Password storage | Bcrypt hash | Password di `.env.local` sebagai bcrypt hash, never plain text |
| Data tampering | Server-side validation | Semua input divalidasi ulang di server via Zod. Never trust client. |

Tidak di-implementasi di MVP: rate limiting, CSP headers, audit logging.

---

## NFR-05: Data Integrity

| Constraint | Mekanisme | Level |
|---|---|---|
| Email unik per event | Composite unique index `(event_id, email)` | Database |
| Ticket ID unik | Unique constraint `ticket_id` | Database |
| Slug unik | Partial unique `(workspace_id, slug) WHERE deleted_at IS NULL` | Database |
| Kuota tidak melebihi max | Atomic `UPDATE ... registered_count < max_quota` dalam transaction | Application + DB |
| Kuota max >= registered count | Server Action validasi saat edit event | Application |
| Registrasi atomic | BEGIN/COMMIT transaction untuk cek + insert | Database (Supabase PostgreSQL) |
| Isolasi tenant | `workspace.owner_id = session.user.id` sebelum setiap organizer query/mutation | Application |

---

## NFR-06: Bahasa

| Context | Bahasa | Contoh |
|---|---|---|
| UI (semua teks ke pengguna) | Bahasa Indonesia | "Daftar Sekarang", "Sisa kuota: 87 dari 100" |
| Kode (variabel, fungsi) | English | `registerParticipant()`, `maxQuota` |
| Komentar kode | English | `// Check email uniqueness per event` |
| Dokumentasi (docs/) | Bahasa Indonesia | PRD, FRD, Architecture |
| Error messages (ke user) | Bahasa Indonesia | "Format email tidak valid" |
| Error messages (log/dev) | English | `console.error("Transaction failed")` |

---

## NFR-07: Browser Support

Evergreen browsers — versi terbaru saja:

- Chrome / Chromium
- Firefox
- Safari
- Edge

Tidak perlu support IE11 atau browser legacy. Polyfill tidak diperlukan.
