# Stitch Visual Reference Prompts

Generate three separate desktop-first screens. Each must remain responsive at 360px. These are intended as Stitch-first frontend foundations, not a generic moodboard. Use the same content model in `docs/design.md`. Visual direction: Luma-inspired editorial event platform, Indonesian, neutral warm-white interface, high-quality event imagery, no Luma branding or copied assets.

For every output: use semantic form labels, reserve visual space for inline errors/loading, use one primary CTA per public surface, and avoid fake features not in scope.

## 1. Landing Page

```text
Design a polished desktop-first landing page for "RuangAcara", an Indonesian SaaS platform for free online event registration and e-tickets. The public visual language is inspired by modern editorial event platforms: warm near-white background, lots of whitespace, sharp sans-serif typography, neutral UI chrome, event cover images provide all color. Do not copy any existing product branding, assets, wording, or exact layout.

Header, 64px: wordmark RuangAcara left; links "Jelajahi Event" and "Masuk sebagai organizer" right.

Main container max 1200px. Hero eyebrow "EVENT ONLINE", bold heading "Temukan percakapan yang layak dihadiri.", muted supporting paragraph in Indonesian. Then section "Event mendatang" with a 3-column grid of six event cards.

Cards: 16:9 colourful cover image, 14px radius, subtle border, very small hover elevation. Body has date/time metadata, 2-line maximum event title, speaker, and remaining quota. Include one card for "Merancang Produk AI yang Bertahan Lama", Saturday 18 October 2026, 19.00 WIB, speaker Nadya Prameswari, "42 dari 100 kursi tersedia". Use Indonesian labels. No filters, no dashboard stats, no gradients, no glass effect, no excess pills. Show responsive intent: 3 cols desktop, 1 col mobile.
```

## 2. Public Event Detail

```text
Design a desktop-first public event page for "RuangAcara", an Indonesian online-event platform. Use an editorial event layout inspired by modern event platforms, but do not copy existing brand assets, CSS, wording, or exact layout.

Top header: RuangAcara wordmark, "Jelajahi Event", "Masuk sebagai organizer". Main container 1120px. A large 16:7 event cover image spans the top. Below: a two-column layout, content left and a 360px sticky registration panel right. On mobile the registration panel stacks after the summary.

Left content: small workspace name "Komunitas Teknologi Indonesia", large title "Merancang Produk AI yang Bertahan Lama", date "Sabtu, 18 Oktober 2026 · 19.00 WIB", speaker "Nadya Prameswari", two restrained category tags, and an Indonesian event description with clear paragraph hierarchy.

Right panel: white card, quota text "42 dari 100 kursi tersedia", heading "Daftar untuk hadir", labelled fields Nama lengkap, Email, Nomor telepon (opsional), and one dark primary CTA "Daftar sekarang". Include helper privacy text. Make the registration panel visually calm and operational, not a marketing card. Avoid maps, social follow controls, attendee avatars, waitlists, gradients, glassmorphism, and copied Luma assets.
```

## 3. E-Ticket

```text
Design a focused e-ticket success page for "RuangAcara", an Indonesian event-registration platform. Public UI is neutral, calm, editorial, printable, and not a dashboard. Do not copy existing product branding or assets.

Warm off-white page background. Center a 480px white ticket card with thin neutral border, subtle shadow, and generous padding. At the top: small green confirmation icon and Indonesian label "Pendaftaran berhasil". Then event title "Merancang Produk AI yang Bertahan Lama". Center a crisp black-and-white QR code. Under it, show monospace ticket ID "WBN-20261018-K7M2".

Use definition-list rows for participant and event detail: Nama "Dimas Saputra", Email "dimas@example.com", Tanggal "Sabtu, 18 Oktober 2026 · 19.00 WIB", Speaker "Nadya Prameswari". Add a restrained note "Simpan halaman ini sebagai bukti pendaftaran." No fake download button, no confetti, no gradients, no dense dashboard elements. Ensure legible print-friendly hierarchy and mobile full-width card behavior.
```
