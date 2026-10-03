import assert from "node:assert/strict";
import { accountRole, isReservedAdminEmail } from "../../src/lib/account-policy";
import config from "../../next.config";

const previousAllowlist = process.env.PLATFORM_ADMIN_EMAILS;
try {
  process.env.PLATFORM_ADMIN_EMAILS = " Admin@Example.com ";
  assert.equal(isReservedAdminEmail("ADMIN@example.com"), true);
  assert.equal(isReservedAdminEmail("other@example.com"), false);
  // An attacker pre-registering an admin mailbox must never be promoted.
  assert.equal(accountRole("admin@example.com", "attendee"), "attendee");
  assert.equal(accountRole("admin@example.com", "organizer"), "organizer");
  assert.equal(accountRole("admin@example.com", "platform_admin"), "platform_admin");
  assert.equal(accountRole("other@example.com", "platform_admin"), "attendee");
  process.env.PLATFORM_ADMIN_EMAILS = "";
  assert.equal(accountRole("admin@example.com", "platform_admin"), "attendee");
} finally {
  if (previousAllowlist === undefined) delete process.env.PLATFORM_ADMIN_EMAILS;
  else process.env.PLATFORM_ADMIN_EMAILS = previousAllowlist;
}
const rules = await config.headers!();
const headers = rules.find((rule) => rule.source === "/:path*")!.headers;
assert.equal(headers.find((header) => header.key === "X-Frame-Options")?.value, "DENY");
assert.match(headers.find((header) => header.key === "Content-Security-Policy")!.value, /frame-ancestors 'none'/);
console.log("Security checks passed: reserved emails, no implicit admin promotion, framing protection.");
