# SaaS Reservasi Webinar & E-Ticketing

Platform multi-tenant untuk organizer membuat event gratis, menerima guest registration, dan menerbitkan e-ticket.

## Language

**Workspace**: Batas tenant milik satu organizer. Semua event organizer berada di satu workspace.
_Avoid_: Organization, tenant (di UI)

**Organizer**: User terautentikasi yang memiliki tepat satu workspace.
_Avoid_: Admin (kecuali Platform Admin)

**Platform Admin**: User dari email allowlist yang mengawasi platform; bukan organizer biasa.
_Avoid_: Superuser

**Event**: Webinar gratis milik satu workspace.
_Avoid_: Acara, webinar (sebagai entitas kode)

**Peserta**: Guest yang mendaftar ke satu event tanpa akun.
_Avoid_: User, subscriber

**Registrasi**: Catatan pendaftaran peserta ke event yang menghasilkan satu e-ticket.
_Avoid_: Booking, reservation

**E-Ticket**: Bukti registrasi digital dengan ticket ID dan QR code.
_Avoid_: Voucher, pass

**Kuota**: Batas `max_quota` event. `registered_count` adalah jumlah registrasi sukses; sisa = max minus registered count.
_Avoid_: Slot, seat

**Lifecycle Event**: `draft`, `published`, `cancelled`, atau `completed`.
_Avoid_: Visibility, state
