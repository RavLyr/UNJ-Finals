# FRD: Kuota Dinamis

Fitur tampilan sisa kuota event yang berkurang setiap ada peserta baru terdaftar, dan mekanisme pengumuman saat kuota habis.

---

## 1. Tampilan Sisa Kuota

### Lokasi

Ditampilkan di halaman `/w/[workspaceSlug]/events/[eventSlug]`, di antara detail event dan form registrasi.

### Format Teks

```
Sisa kuota: {remaining} dari {max}
```

Contoh: **"Sisa kuota: 87 dari 100"**

### Perhitungan

```sql
remaining = event.max_quota - event.registered_count
```

- `registered_count` adalah jumlah registrasi sukses, bukan temporary reservation hold.
- Dihitung di **Server Component** saat page load — bukan di client
- Tidak perlu real-time update (WebSocket) — data akurat saat halaman dibuka
- Setelah registrasi berhasil, `revalidatePath()` public event dipanggil → halaman menampilkan angka terbaru saat di-refresh

### Komponen

- File: `src/components/quota-display.tsx` (atau inline di page Server Component)
- Tipe: **Server Component** — tidak perlu client JS untuk menampilkan angka

### Visual Indicator (Warna)

| Kondisi | Warna | Keterangan |
|---|---|---|
| remaining > 20% dari max | Hijau (`text-green-600`) | Masih banyak slot |
| remaining > 0 dan <= 20% | Kuning/Orange (`text-amber-600`) | Hampir habis |
| remaining = 0 | Merah (`text-red-600`) | Habis — form disembunyikan |

Threshold 20% bisa di-hardcode. Contoh: kuota max 100 → kuning saat remaining <= 20.

---

## 2. State Kuota Penuh

### Kondisi

`remaining = 0` (semua slot terisi)

### Behavior

| Elemen | Saat kuota > 0 | Saat kuota = 0 |
|---|---|---|
| Detail event | Tampil | Tampil (tidak berubah) |
| Teks sisa kuota | "Sisa kuota: X dari Y" (hijau/kuning) | "Sisa kuota: 0 dari Y" (merah) |
| Banner kuota penuh | Tidak tampil | **Tampil** |
| Form registrasi | Tampil | **Tidak di-render** |

### Banner Kuota Penuh

```
┌──────────────────────────────────────────────┐
│  ⚠ Maaf, kuota untuk event ini sudah penuh.  │
└──────────────────────────────────────────────┘
```

- Tampilkan sebagai banner/alert di posisi form seharusnya berada
- Warna: background merah muda / amber, border kiri tebal
- **Form tidak di-render sama sekali** (bukan `disabled`, bukan `hidden`) — ini mencegah user meng-inspect element dan menghapus attribute disabled

### Implementasi di Page Component

```tsx
// src/app/w/[workspaceSlug]/events/[eventSlug]/page.tsx (pseudocode)
const remaining = maxQuota - registrantCount;

return (
  <>
    <EventDetail event={event} />
    <QuotaDisplay remaining={remaining} max={maxQuota} />
    
    {remaining > 0 ? (
      <RegistrationForm eventId={event.id} />
    ) : (
      <QuotaFullBanner />
    )}
  </>
);
```

---

## 3. Kuota dan Registrasi (Interaksi)

### Timeline

```
1. User buka halaman event
   → Server Component fetch: remaining = 5
   → Tampil "Sisa kuota: 5 dari 100", form tampil

2. User isi form, submit
   → Server Action: cek remaining di DB (dalam transaksi)
   → Jika masih ada slot → insert → remaining jadi 4
   → revalidatePath() → halaman akan tampil "4 dari 100" saat di-refresh

3. Peserta lain juga submit saat bersamaan
   → Transaksi DB menjamin kuota tidak minus (lihat FRD Registrasi)

4. Remaining = 0
   → Halaman di-refresh → form hilang, banner "Kuota Penuh" muncul
```

### Race Condition: User Buka Halaman Saat Kuota 1

```
User A buka halaman: remaining = 1, form tampil
User B buka halaman: remaining = 1, form tampil
User A submit: berhasil, remaining → 0
User B submit: Server Action cek DB → remaining = 0 → ditolak "Kuota sudah habis"
User B refresh halaman: form hilang, banner kuota penuh
```

Server Action **selalu** reserve kuota atomically di DB (bukan mengandalkan angka yang di-render di client). Client-side tampilan kuota hanya informatif.

### Atomic Reservation Algorithm

Dalam satu DB transaction, reserve satu slot lebih dulu:

```sql
UPDATE events
SET registered_count = registered_count + 1,
    updated_at = NOW()
WHERE id = $eventId
  AND status = 'published'
  AND deleted_at IS NULL
  AND registered_count < max_quota
RETURNING id;
```

- Tidak ada row returned: event tidak tersedia atau kuota penuh.
- Lalu insert registration.
- Jika insert gagal, termasuk duplicate `(event_id, email)`, transaction rollback sehingga counter tidak bertambah.
- Jangan gunakan `COUNT(registrations)` sebagai concurrency guard.

---

## 4. Kuota dan Admin (Interaksi)

### Admin Ubah Kuota Max

- Admin bisa edit `max_quota` event
- **Constraint**: `max_quota` baru **tidak boleh lebih kecil** dari jumlah registrant saat ini
- Contoh: 50 orang sudah daftar → admin tidak bisa set kuota ke 40
- Validasi ini dilakukan di Server Action `updateEvent()`

### Admin Hapus Event

- Soft delete → event tidak muncul di publik
- Registrasi yang sudah ada tetap di database
- Kuota tidak relevan lagi setelah event dihapus

---

## 5. Edge Cases

| Skenario | Expected Behavior |
|---|---|
| Admin set kuota max = 0 saat create event | Validasi: kuota minimum 1. Ditolak. |
| Admin set kuota max = jumlah registrant saat ini | Dibolehkan. Sisa kuota jadi 0. Form hilang. |
| Admin naikkan kuota setelah penuh | Sisa kuota jadi > 0. Form muncul lagi saat halaman di-refresh. |
| 100 orang buka halaman bersamaan, kuota sisa 5 | 5 orang pertama yang submit berhasil (transaksi DB). 95 sisanya ditolak. Halaman refresh → form hilang. |
