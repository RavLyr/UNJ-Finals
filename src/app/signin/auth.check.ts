// Run: bun src/app/signin/auth.check.ts
import assert from "node:assert/strict";
import authConfig, { authDestination } from "../../lib/auth.config";

const event = "/w/komunitas-teknologi/events/webinar-ai";
assert.equal(authDestination("attendee", event), event);
for (const unsafe of ["https://evil.example", "//evil.example", "/dashboard", "/tickets/other", `${event}?redirect=https://evil.example`, `${event}/..`, "/w/%2f%2fevil/events/test", "/w/test\\evil/events/test", [event]]) {
  assert.equal(authDestination("attendee", unsafe), "/tickets");
}
assert.equal(authDestination("organizer", event), "/dashboard");
assert.equal(authDestination("platform_admin", event), "/admin");
assert.equal(authConfig.session.maxAge, 28800);
assert.equal(authConfig.session.strategy, "jwt");
assert.deepEqual(authConfig.providers, []);
console.log("Auth check passed: role destinations, unsafe redirect rejection, Edge config, JWT lifetime.");
