# FRD: QR Check-in

**Phase**: 1

Organizer membuka scanner dari dashboard event. QR berisi plain `ticket_id`; scanner mengirim ticket ID ke Server Action server-only.

## Rules

- Hanya owner workspace event dapat check-in.
- Ticket harus milik event yang dipilih.
- Ticket event cancelled tetap tidak dapat check-in.
- Ticket completed dapat dilihat read-only, tetapi check-in ditolak.
- `checked_in_at IS NULL` → set `checked_in_at = NOW()` dan return sukses.
- `checked_in_at IS NOT NULL` → return "Peserta sudah check-in pada {timestamp}" tanpa overwrite.

## Schema Addition

`registrations.checked_in_at timestamptz nullable`.

## UI

- Scanner camera sebagai enhancement; input ticket ID manual wajib tersedia sebagai fallback.
- Sukses: nama peserta, ticket ID, waktu check-in.
- Gagal: ticket tidak ditemukan, milik event lain, event tidak valid, atau sudah check-in.
