// Opt-in, existing test data only:
// DATABASE_URL=... REGISTRATION_CHECK_ID=<existing test registration UUID> bun src/server/actions/registration.self-check.mjs
import assert from "node:assert/strict";
import { mock } from "bun:test";
import postgres from "postgres";

assert.ok(process.env.DATABASE_URL, "DATABASE_URL required");
assert.match(process.env.REGISTRATION_CHECK_ID ?? "", /^[0-9a-f-]{36}$/i, "Existing test registration ID required");
assert.notEqual(process.env.VERCEL_ENV, "preview", "Run against a test database outside preview");
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
try {
  const [existing] = await sql`
    select r.*, e.registered_count, e.max_quota, e.status, e.deleted_at, u.role
    from registrations r join events e on e.id = r.event_id join users u on u.id = r.attendee_id
    where r.id = ${process.env.REGISTRATION_CHECK_ID}::uuid
  `;
  assert.ok(existing, "Test registration not found");
  assert.equal(existing.role, "attendee");
  assert.equal(existing.status, "published");
  assert.equal(existing.deleted_at, null);
  assert.ok(existing.registered_count < existing.max_quota, "Spare quota required to exercise insert rollback");
  // Only framework boundaries are replaced; session/data come from existing DB rows.
  mock.module("server-only", () => ({}));
  mock.module("@/lib/auth", () => ({
    auth: async () => ({ user: { id: existing.attendee_id, role: existing.role } }),
    previewNotice: "Mode pratinjau: perubahan dan pendaftaran dinonaktifkan.",
  }));
  mock.module("next/cache", () => ({ revalidatePath: () => assert.fail("Failed registration revalidated paths") }));
  mock.module("next/navigation", () => ({ redirect: () => assert.fail("Failed registration redirected") }));
  const { registerParticipant } = await import("./register.ts");
  const form = new FormData();
  for (const [key, value] of Object.entries({
    eventId: existing.event_id, name: existing.name, email: existing.email, phone: existing.phone ?? "",
  })) form.set(key, value);
  const results = await Promise.all([
    registerParticipant(null, form), registerParticipant(null, form),
  ]);
  for (const result of results) assert.deepEqual(result, { success: false, error: "Email sudah terdaftar" });
  const [after] = await sql`select registered_count from events where id = ${existing.event_id}::uuid`;
  assert.equal(after.registered_count, existing.registered_count, "Duplicate insert leaked reserved quota");
  console.log("Concurrent duplicate-registration rollback check passed");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await sql.end();
  // getDb owns a separate pool; terminate after this standalone check.
  process.exit(process.exitCode ?? 0);
}
