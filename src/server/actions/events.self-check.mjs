// Run: bun src/server/actions/events.self-check.mjs
import assert from "node:assert/strict";
import { mock } from "bun:test";

mock.module("server-only", () => ({}));
mock.module("@/lib/auth", () => ({ auth: () => null, previewNotice: "preview" }));
mock.module("next/cache", () => ({ revalidatePath: () => {} }));
const { canTransitionEvent } = await import("./helpers.ts");

// Explore whole lifecycle histories: no reachable terminal may reopen registration.
const statuses = ["draft", "published", "cancelled", "completed"];
const histories = [["draft"]];
const reachable = new Set();
while (histories.length) {
  const history = histories.pop();
  const current = history.at(-1);
  reachable.add(current);
  for (const next of statuses) {
    if (!canTransitionEvent(current, next)) continue;
    assert.ok(!history.includes(next), `Lifecycle cycle: ${history.join(",")} to ${next}`);
    assert.ok(current !== "cancelled" && current !== "completed", `Terminal event reopened: ${current}`);
    assert.ok(history.includes("published") || next === "published", "Cancellation/completion bypassed publishing");
    histories.push([...history, next]);
  }
}
assert.deepEqual(reachable, new Set(statuses));
console.log("Event lifecycle self-check passed");
