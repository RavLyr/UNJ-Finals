/**
 * Demo seed for local development and Vercel preview.
 *
 * Preview and production share one Supabase Free project, so this inserts
 * demo/test data only. It is never run by CI; Agent A runs it manually.
 *
 * Usage:
 *   ALLOW_SEED=1 bun run db:seed
 */
import { hash } from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { generateSlug } from "../src/lib/slug";
import { generateTicketId } from "../src/lib/ticket-id";
import { events, registrations, users, workspaces } from "../src/server/db/schema";
import type { Event, User, Workspace } from "../src/lib/types";

const DEMO_PASSWORD = "Demo#12345";
const ORGANIZER_EMAIL = "demo-organizer@example.com";
const ATTENDEE_EMAILS = [
  "demo-attendee-1@example.com",
  "demo-attendee-2@example.com",
  "demo-attendee-3@example.com",
  "demo-attendee-4@example.com",
] as const;

const DAY = 86_400_000;
const NOW = Date.now();

interface EventSeed {
  title: string;
  slug: string;
  description: string;
  dateTime: Date;
  maxQuota: number;
  speaker: string | null;
  tags: string | null;
  status: Event["status"];
  cancellationReason: string | null;
  attendees: { name: string; email: string; checkedIn: boolean }[];
}

const seeds: EventSeed[] = [
  {
    title: "Kelas Praktis Membangun SaaS Multi-Tenant",
    slug: "kelas-praktis-membangun-saas-multi-tenant",
    description:
      "Sesi wajib untuk engineer yang ingin memahami multi-tenant SaaS: pemisahan data per tenant, tenant isolation, dan resolutions kuota yang aman terhadap race condition.",
    dateTime: new Date(NOW + 7 * DAY),
    maxQuota: 100,
    speaker: "Rani Puspita",
    tags: "engineering,saas,backend",
    status: "published",
    cancellationReason: null,
    attendees: [
      { name: "Budi Santoso", email: ATTENDEE_EMAILS[0], checkedIn: true },
      { name: "Citra Dewi", email: ATTENDEE_EMAILS[1], checkedIn: true },
      { name: "Dimas Anggara", email: ATTENDEE_EMAILS[2], checkedIn: false },
      { name: "Eka Wulandari", email: ATTENDEE_EMAILS[3], checkedIn: false },
    ],
  },
  {
    title: "Workshop Frontend Tailwind v4 untuk Tim Produk",
    slug: "workshop-frontend-tailwind-v4",
    description:
      "Hands-on: token design, dark mode, dan migrasi dari konfigurasi JS ke CSS-first. Kuota sengaja dibuat penuh supaya state 'Kuota Penuh' bisa didemokan.",
    dateTime: new Date(NOW + 14 * DAY),
    maxQuota: 3,
    speaker: "Andi Prasetyo",
    tags: "frontend,design-system",
    status: "published",
    cancellationReason: null,
    attendees: [
      { name: "Fajar Nugroho", email: ATTENDEE_EMAILS[1], checkedIn: false },
      { name: "Gita Ayu", email: ATTENDEE_EMAILS[2], checkedIn: false },
      { name: "Hendra Kusuma", email: ATTENDEE_EMAILS[3], checkedIn: false },
    ],
  },
  {
    title: "Ruang Diskusi: Monetisasi Webinar untuk Komunitas",
    slug: "ruang-diskusi-monetisasi-webinar",
    description: "Sesi internal untuk discussion pack. Belum tayang: halaman publik harus 404.",
    dateTime: new Date(NOW + 21 * DAY),
    maxQuota: 50,
    speaker: null,
    tags: "bisnis",
    status: "draft",
    cancellationReason: null,
    attendees: [],
  },
  {
    title: "Masterclass Retensi Peserta Webinar",
    slug: "masterclass-retensi-peserta-webinar",
    description:
      "Dibatalkan karena sebagian besar pemateri berhalangan. Halaman publik tetap tampil dengan banner pembatalan.",
    dateTime: new Date(NOW + 3 * DAY),
    maxQuota: 120,
    speaker: "Sinta Larasati",
    tags: "retensi",
    status: "cancelled",
    cancellationReason: "Pemateri utama berhalangan hadir, jadwal akan diumumkan kembali.",
    attendees: [{ name: "Irfan Maulana", email: ATTENDEE_EMAILS[0], checkedIn: false }],
  },
  {
    title: "Rekaman Webinar: Arsitektur Event-Driven",
    slug: "rekaman-webinar-arsitektur-event-driven",
    description:
      "Arsip read-only. Pendaftaran dan check-in ditutup, tiket peserta tetap bisa diakses.",
    dateTime: new Date(NOW - 10 * DAY),
    maxQuota: 80,
    speaker: "Tomi Hardiman",
    tags: "arsip,arsitektur",
    status: "completed",
    cancellationReason: null,
    attendees: [
      { name: "Joko Susilo", email: ATTENDEE_EMAILS[1], checkedIn: true },
      { name: "Kartika Sari", email: ATTENDEE_EMAILS[2], checkedIn: true },
    ],
  },
];

function workspaceSlug(name: string): string {
  const base = generateSlug(name);
  return base.length >= 3 ? base : `demo-${NOW.toString(36)}`;
}

async function main() {
  if (process.env.ALLOW_SEED !== "1") {
    console.error("Seed dibatalkan. Jalankan dengan ALLOW_SEED=1 untuk mengizinkan penulisan data demo.");
    process.exit(1);
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !databaseUrl.startsWith("postgres")) {
    console.error("DATABASE_URL tidak ditemukan. Isi .env.local terlebih dahulu.");
    process.exit(1);
  }
  if (process.env.VERCEL_ENV) {
    console.error("Seed tidak boleh jalan di Vercel (VERCEL_ENV terisi). Jalankan dari mesin lokal.");
    process.exit(1);
  }

  const db = drizzle(postgres(databaseUrl, { prepare: false }));
  const passwordHash = await hash(DEMO_PASSWORD, 12);

  const upsertUser = async (email: string, name: string, role: User["role"]) => {
    await db.insert(users).values({ email, name, role, passwordHash }).onConflictDoNothing({ target: users.email });
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!row) throw new Error(`Gagal membuat user ${email}`);
    return row;
  };

  const organizer = await upsertUser(ORGANIZER_EMAIL, "Demo Organizer", "organizer");
  const attendees = new Map<string, string>();
  for (const [index, email] of ATTENDEE_EMAILS.entries()) {
    const user = await upsertUser(email, `Demo Peserta ${index + 1}`, "attendee");
    attendees.set(email, user.id);
  }

  const [existingWorkspace] = await db.select().from(workspaces)
    .where(eq(workspaces.ownerId, organizer.id)).limit(1);
  let workspace: Workspace;
  if (existingWorkspace) {
    workspace = existingWorkspace;
    console.log(`Workspace dipakai ulang: ${workspace.slug}`);
  } else {
    const [created] = await db.insert(workspaces)
      .values({ ownerId: organizer.id, name: "Demo Organizer", slug: workspaceSlug("Demo Organizer") })
      .returning();
    if (!created) throw new Error("Gagal membuat workspace");
    workspace = created;
  }

  let created = 0;
  let skipped = 0;
  for (const seed of seeds) {
    const [existingEvent] = await db.select({ id: events.id }).from(events).where(and(
      eq(events.workspaceId, workspace.id),
      eq(events.slug, seed.slug),
      isNull(events.deletedAt),
    )).limit(1);
    if (existingEvent) {
      skipped += 1;
      continue;
    }
    const rows = seed.attendees.map((attendee) => {
      const attendeeId = attendees.get(attendee.email);
      if (!attendeeId) throw new Error(`Attendee ${attendee.email} belum dibuat`);
      return {
        attendeeId,
        name: attendee.name,
        email: attendee.email,
        checkedInAt: attendee.checkedIn ? new Date(NOW - 2 * DAY) : null,
      };
    });
    await db.transaction(async (tx) => {
      const [event] = await tx.insert(events).values({
        workspaceId: workspace.id,
        title: seed.title,
        slug: seed.slug,
        description: seed.description,
        dateTime: seed.dateTime,
        maxQuota: seed.maxQuota,
        speaker: seed.speaker,
        tags: seed.tags,
        status: seed.status,
        cancellationReason: seed.cancellationReason,
      }).returning();
      if (!event) throw new Error(`Gagal membuat event ${seed.slug}`);
      if (rows.length) {
        await tx.insert(registrations).values(
          rows.map((row) => ({ ...row, eventId: event.id, ticketId: generateTicketId() })),
        );
      }
      await tx.update(events).set({ registeredCount: rows.length }).where(eq(events.id, event.id));
    });
    created += 1;
  }

  const tickets = await db
    .select({ ticketId: registrations.ticketId, name: registrations.name, eventTitle: events.title })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .where(eq(events.workspaceId, workspace.id));

  console.log(`\nSeed selesai. Event baru: ${created}, dilewati: ${skipped}.`);
  console.log(`\nLogin organizer: ${ORGANIZER_EMAIL} / ${DEMO_PASSWORD}`);
  for (const email of ATTENDEE_EMAILS) console.log(`Login attendee:  ${email} / ${DEMO_PASSWORD}`);
  console.log(`\nHalaman publik /w/${workspace.slug}/events/<slug>:`);
  for (const seed of seeds) {
    console.log(`  ${seed.status.padEnd(9)} /w/${workspace.slug}/events/${seed.slug}`);
  }
  console.log("\nTicket ID untuk demo check-in:");
  for (const ticket of tickets) console.log(`  ${ticket.ticketId}  ${ticket.name} (${ticket.eventTitle})`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
