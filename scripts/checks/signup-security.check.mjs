import assert from "node:assert/strict";
import { mock } from "bun:test";
import { z } from "zod";
import { accountRole } from "../../src/lib/account-policy";

// Isolate pre-persistence validation; no connection to the shared database.
mock.module("@/lib/auth", () => ({
  accountRole,
  credentialsSchema: z.object({ email: z.string().email(), password: z.string().min(1) }),
  previewNotice: "preview",
  signIn: () => assert.fail("Unexpected sign-in"),
}));
mock.module("@/server/db", () => ({ getDb: () => assert.fail("Rejected signup reached the database") }));
mock.module("next/cache", () => ({ revalidatePath: () => assert.fail("Rejected signup invalidated cache") }));
mock.module("next/navigation", () => ({ redirect: () => assert.fail("Rejected signup redirected") }));
const { registerAccount } = await import("../../src/server/actions/auth");
const previous = process.env.PLATFORM_ADMIN_EMAILS;
const preview = process.env.VERCEL_ENV;
try {
  delete process.env.VERCEL_ENV;
  process.env.PLATFORM_ADMIN_EMAILS = "admin@example.com";
  for (const [email, password, role] of [
    ["admin@example.com", "test-password-long", "attendee"],
    ["admin@example.com", "test-password-long", "organizer"],
    ["user@example.com", "x", "attendee"],
    ["user@example.com", "test-password-long", "platform_admin"],
  ]) {
    const form = new FormData();
    for (const [key, value] of Object.entries({ name: "Security test", email, password, confirmPassword: password, role })) form.set(key, value);
    const result = await registerAccount(null, form);
    assert.equal(result.success, false);
  }
} finally {
  if (previous === undefined) delete process.env.PLATFORM_ADMIN_EMAILS;
  else process.env.PLATFORM_ADMIN_EMAILS = previous;
  if (preview === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = preview;
}
console.log("Signup security checks passed: reserved email, weak password, forged admin role rejected before DB access.");
