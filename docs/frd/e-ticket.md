# FRD: E-Ticket (Halaman Success)

Halaman yang menampilkan bukti registrasi berupa e-ticket digital dengan QR code unik setelah peserta berhasil mendaftar.

---

## 1. Halaman Success

### URL

```
/success/[ticketId]
```

Contoh: `/success/WBN-20260928-A3F2`

### Akses

- **Publik** — tidak perlu auth
- Bisa diakses ulang kapan saja via URL (data dari database, bukan session)
- Jika `ticketId` tidak ditemukan di DB → return **404**

### Data Source

Server Component fetch dari database:

```sql
SELECT r.*, e.title, e.date_time, e.speaker
FROM registrations r
JOIN events e ON r.event_id = e.id
WHERE r.ticket_id = ?
```

---

## 2. Konten E-Ticket

### Elemen yang Ditampilkan

| Elemen | Sumber Data | Keterangan |
|---|---|---|
| Ticket ID | `registrations.ticket_id` | Format: `WBN-YYYYMMDD-XXXX`, prominent/besar |
| QR Code | Generated dari ticket ID | Client-side via `qrcode.react`, value = ticket ID |
| Nama peserta | `registrations.name` | |
| Email peserta | `registrations.email` | |
| Judul event | `events.title` | |
| Tanggal & waktu event | `events.date_time` | Format via `formatEventDate()`: "Sabtu, 28 September 2026 · 14:00 WIB" |
| Speaker | `events.speaker` | Jika ada. Jika null, tidak ditampilkan. |

Date formatting menggunakan `date-fns` + locale `id`. Lihat `src/lib/format-date.ts` di architecture.md.

### Elemen yang TIDAK Ditampilkan

- Nomor telepon peserta (privasi)
- Kuota event
- Status event
- Tombol daftar ulang

### Layout

```
┌──────────────────────────────────────┐
│           E-TICKET                    │
│                                      │
│  ┌──────────┐                        │
│  │          │   WBN-20260928-A3F2    │
│  │  QR CODE │                        │
│  │          │                        │
│  └──────────┘                        │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  Nama     : John Doe                 │
│  Email    : john@example.com         │
│  Event    : Workshop React Advanced  │
│  Tanggal  : Sabtu, 28 Sep 2026      │
│             14:00 WIB               │
│  Speaker  : Jane Smith              │
│                                      │
└──────────────────────────────────────┘
```

- Card-style, centered di halaman
- Responsif: desktop = card centered, mobile = full width dengan padding
- Background putih, shadow subtle
- QR code di bagian atas, prominent

### Komponen

- File: `src/components/ticket-card.tsx`
- Tipe: **Client Component** (`"use client"`) — karena `qrcode.react` butuh client-side rendering
- Props: data registrasi + data event

---

## 3. Ticket ID

### Format

```
WBN-YYYYMMDD-XXXX
```

| Segment | Deskripsi | Contoh |
|---|---|---|
| `WBN` | Prefix tetap (Webinar) | `WBN` |
| `YYYYMMDD` | Tanggal registrasi (bukan tanggal event) | `20260928` |
| `XXXX` | 4 karakter alfanumerik random uppercase | `A3F2` |

### Contoh

- `WBN-20260928-A3F2`
- `WBN-20260930-7KM9`
- `WBN-20261015-BC4X`

### Generator

- File: `src/lib/ticket-id.ts`
- Generate **server-side** di dalam transaksi registrasi
- Tanggal: **UTC date** dari server (`new Date()` di Node.js), bukan timezone user
- Karakter random dari set: `A-Z`, `0-9` (36 simbol)
- Kombinasi per hari: 36^4 = **1.679.616**

### Collision Handling

1. Generate ticket ID
2. Coba INSERT ke database (`ticket_id` kolom UNIQUE)
3. Jika unique constraint violation → generate ulang 1x
4. Jika masih collision → throw error: "Gagal membuat ticket ID, silakan coba lagi"

```typescript
// src/lib/ticket-id.ts (pseudocode)
export function generateTicketId(): string {
  const date = new Date();
  const dateStr = format(date, "yyyyMMdd");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const random = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `WBN-${dateStr}-${random}`;
}
```

---

## 4. QR Code

### Library

`qrcode.react` — React component, render sebagai inline SVG.

### Implementasi

```tsx
import { QRCodeSVG } from "qrcode.react";

<QRCodeSVG
  value={ticketId}          // "WBN-20260928-A3F2"
  size={200}                 // 200x200 px
  level="M"                  // Error correction level: Medium
  includeMargin={true}       // White margin around QR
/>
```

### QR Code Value

- Value = **ticket ID string** (e.g., `WBN-20260928-A3F2`)
- Bukan URL — hanya plain text identifier
- Saat di-scan, QR reader menampilkan teks ticket ID

### Ukuran

- Minimum: 200x200 px (QR code butuh resolusi cukup agar scannable)
- Di mobile: scale down proportionally, minimum 150px
- SVG rendering → sharp di semua resolusi (tidak pixelated)

---

## 5. Redirect Flow

```
Form submit via useActionState (Client Component)
      │
      ▼
Server Action registerParticipant()
      │
      ├── Gagal → return ActionResult { success: false, error }
      │            → client shows toast.error(error)
      │
      ▼ Berhasil
revalidatePath(`/w/${workspaceSlug}/events/${eventSlug}`)
redirect("/success/WBN-20260928-A3F2")   ← throws internally
      │
      ▼
Server Component: fetch data by ticketId
      │
      ▼
Render TicketCard (Client Component)
```

Redirect menggunakan `redirect()` dari `next/navigation` **di dalam Server Action**. Ini throws — jangan wrap di try/catch. Panggil setelah semua DB operations selesai.

---

## 6. Edge Cases

| Skenario | Expected Behavior |
|---|---|
| User akses `/success/INVALID-ID` | 404 page |
| User bookmark halaman success, buka minggu depan | Tetap tampil — data dari DB, bukan session |
| Admin hapus event setelah tiket terbit | Tiket tetap bisa diakses (soft delete event, data registrasi tetap ada, JOIN ke event masih bisa karena row masih ada) |
| QR code di-scan | Menampilkan teks ticket ID. Tidak ada aksi otomatis (bukan URL). |
| User print halaman | Layout sudah card-based, printable by default. Opsional: tambah `@media print` CSS untuk hilangkan elemen non-essential. |
