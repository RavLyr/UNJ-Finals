# FRD: Registrasi Peserta

Fitur inti sistem — peserta mengisi form di halaman event, data divalidasi berlapis, disimpan ke database dalam satu transaksi, dan menghasilkan e-ticket.

---

## 1. Form Registrasi

### Lokasi

Ditampilkan di halaman `/w/[workspaceSlug]/events/[eventSlug]`, **hanya jika**:
- Event berstatus `published`
- Sisa kuota > 0

Jika salah satu tidak terpenuhi, form **tidak di-render** (bukan disabled).

### Field

| Field | HTML Type | Wajib | Placeholder | Keterangan |
|---|---|---|---|---|
| Nama Lengkap | `text` | Ya | "Masukkan nama lengkap" | Trim whitespace sebelum simpan |
| Email | `email` | Ya | "contoh@email.com" | Case-insensitive (simpan lowercase) |
| Nomor Telepon | `tel` | Tidak | "08xxxxxxxxxx" | Boleh kosong, tapi jika diisi harus valid |

### Komponen

- File: `src/components/registration-form.tsx`
- Tipe: **Client Component** (`"use client"`) — karena butuh interaksi form, state, dan validasi on-blur
- Submit via: `useActionState()` (React 19) bound ke Server Action `registerParticipant()` di `src/server/actions/register.ts`
- Return type: `ActionResult<{ ticketId: string }>` (lihat `src/lib/types.ts`)

---

## 2. Aturan Validasi

Validasi dilakukan **dua lapis**: client-side (UX cepat) dan server-side (keamanan). Keduanya menggunakan **Zod schema yang sama** dari `src/lib/validations.ts`.

### 2.1 Validasi Nama Lengkap

| Aturan | Kondisi | Pesan Error |
|---|---|---|
| Wajib diisi | String kosong atau hanya whitespace | "Nama lengkap wajib diisi" |
| Minimum | < 2 karakter (setelah trim) | "Nama minimal 2 karakter" |
| Maksimum | > 100 karakter | "Nama maksimal 100 karakter" |

### 2.2 Validasi Email

| Aturan | Kondisi | Pesan Error |
|---|---|---|
| Wajib diisi | String kosong | "Email wajib diisi" |
| Format valid | Tidak match regex email (RFC 5322 simplified via Zod `.email()`) | "Format email tidak valid" |
| Unik per event | Email sudah ada di tabel `registrations` untuk `event_id` yang sama | "Email ini sudah terdaftar untuk event ini" |

**Catatan**: Cek duplikat email **hanya di server-side** — tidak bisa di-cek di client tanpa API call. Error ditampilkan setelah submit.

### 2.3 Validasi Nomor Telepon

| Aturan | Kondisi | Pesan Error |
|---|---|---|
| Opsional | Boleh kosong — skip semua validasi di bawah | — |
| Hanya angka | Mengandung karakter selain digit (setelah strip `+` dan `-`) | "Nomor telepon hanya boleh berisi angka" |
| Panjang minimum | < 10 digit | "Nomor telepon minimal 10 digit" |
| Panjang maksimum | > 15 digit | "Nomor telepon maksimal 15 digit" |
| Prefix valid | Tidak diawali `08` atau `+62` | "Nomor telepon harus diawali 08 atau +62" |

### Zod Schema (referensi)

```typescript
// src/lib/validations.ts
export const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z
    .string()
    .email("Format email tidak valid")
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^(\+62|08)\d{8,13}$/.test(v.replace(/[-\s]/g, "")),
      "Nomor telepon tidak valid (10-15 digit, awali 08 atau +62)"
    ),
});
```

---

## 3. Validasi Client-Side

| Kapan | Mekanisme |
|---|---|
| On blur (user keluar dari field) | Validasi field tersebut saja, tampilkan error inline di bawah field |
| On submit | Validasi semua field sekaligus, fokuskan ke field pertama yang error |
| Saat mengetik (setelah pernah error) | Re-validasi field yang sebelumnya error, hapus error saat valid |

**UI behavior:**
- Error message ditampilkan di bawah field, warna merah, font kecil
- Field yang error diberi border merah
- Tombol "Daftar" **tidak di-disable** — user bisa klik kapan saja, validasi tetap berjalan
- Loading state: tombol berubah jadi spinner + "Mendaftar..." saat submit ke server

---

## 4. Validasi Server-Side

Server Action `registerParticipant()` melakukan validasi ulang **seluruh input** — tidak percaya client.

Urutan validasi server:

1. **Parse & validasi Zod** — jika gagal, return field errors
2. **Cek event exist & published** — jika tidak, return error "Event tidak ditemukan"
3. **Reserve slot atomically** — increment `registered_count` hanya saat masih `< max_quota`
4. **Insert registrasi** — generate ticket ID, simpan. Database unique constraint menolak email duplikat.
5. Insert gagal harus rollback, termasuk increment counter.
6. **revalidatePath** + **redirect()** — `redirect("/success/${ticketId}")` (throws internally, jangan wrap di try/catch)

### Server Action Signature

```typescript
// src/server/actions/register.ts
"use server"
import { redirect } from "next/navigation";

export async function registerParticipant(
  prevState: ActionResult<{ ticketId: string }> | null,
  formData: FormData
): Promise<ActionResult<{ ticketId: string }>> {
  // 1. Zod parse formData
  // 2. DB transaction (atomic reserve slot, insert registration)
  // 3. revalidatePath(`/event/${slug}`)
  // 4. redirect(`/success/${ticketId}`) ← throws, must be last line
}
```

---

## 5. Database Transaction (Race Condition Guard)

Registrasi **wajib** menggunakan database transaction untuk mencegah:
- Dua request simultan dengan email sama lolos duplikat check
- Dua request simultan melebihi kuota (kuota = 1 tersisa, dua orang submit bersamaan)

### Pseudocode Transaksi

```
BEGIN TRANSACTION

  1. SELECT * FROM events WHERE id = ? AND status = 'published' AND deleted_at IS NULL
     → jika tidak ada, ROLLBACK, return "Event tidak ditemukan"

   2. UPDATE events
      SET registered_count = registered_count + 1
      WHERE id = ? AND registered_count < max_quota
      RETURNING id
      → jika tidak ada row, ROLLBACK, return "Kuota sudah habis"

   3. ticketId = generateTicketId()  // WBN-YYYYMMDD-XXXX

   4. INSERT INTO registrations (event_id, name, email, phone, ticket_id)
      VALUES (?, ?, ?, ?, ?)
      → jika unique(event_id, email) violation: ROLLBACK, return "Email sudah terdaftar"

COMMIT

revalidatePath(`/w/${workspaceSlug}/events/${eventSlug}`)
redirect(`/success/${ticketId}`)
```

### Kenapa Transaksi?

Tanpa transaksi, skenario ini bisa terjadi:

```
Request A: SELECT count = 99 (kuota 100, masih 1 sisa)
Request B: SELECT count = 99 (belum commit A)
Request A: INSERT → count jadi 100 ✓
Request B: INSERT → count jadi 101 ✗ MELEBIHI KUOTA
```

Dengan atomic `UPDATE ... registered_count < max_quota`, hanya satu request bisa reserve slot terakhir. Insert gagal rollback counter.

---

## 6. Error Handling & UI Feedback

### Error dari Server

| Error | UI Response |
|---|---|
| Validasi Zod gagal | Tampilkan error per field (inline, merah) |
| "Event tidak ditemukan" | Redirect ke 404 atau tampilkan error page |
| "Email sudah terdaftar" | Toast via Sonner: `toast.error("Email ini sudah terdaftar untuk event ini")` |
| "Kuota sudah habis" | Toast via Sonner: `toast.error("Maaf, kuota sudah habis")`. Refresh → form hilang. |
| Unexpected error (DB down, dll) | Toast: `toast.error("Terjadi kesalahan. Silakan coba lagi.")` |

### Success

- Redirect ke `/success/[ticketId]`
- Tidak ada toast success di halaman event (user sudah pindah halaman)

---

## 7. Edge Cases

| Skenario | Expected Behavior |
|---|---|
| User submit form, lalu tekan back browser | Halaman event tampil ulang. Kuota sudah berkurang (karena `revalidatePath`). Email sudah terdaftar — jika submit lagi, ditolak. |
| User buka 2 tab, submit di kedua-duanya | Tab pertama berhasil. Tab kedua: email ditolak (duplikat) ATAU kuota ditolak (habis). Tergantung mana yang sampai duluan. |
| Admin hapus event saat user sedang isi form | Submit → error "Event tidak ditemukan". |
| Admin unpublish event saat user sedang isi form | Submit → error "Event tidak ditemukan". |
| User masukkan email dengan uppercase | Email di-lowercase sebelum simpan dan sebelum cek duplikat. `John@Email.com` = `john@email.com`. |
| Network timeout saat submit | Loading spinner tetap. User bisa retry. Server-side idempotency via duplikat email check — jika request pertama berhasil, retry akan ditolak "sudah terdaftar". |
