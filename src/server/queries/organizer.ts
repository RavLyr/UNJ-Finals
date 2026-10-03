import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import { events, registrations } from "@/server/db/schema";
import { findOwnedEvent, requireOrganizerWorkspace } from "@/server/actions/helpers";

export async function getOrganizerEvents() {
  const workspace = await requireOrganizerWorkspace();
  return getDb().select().from(events).where(and(
    eq(events.workspaceId, workspace.id), isNull(events.deletedAt),
  )).orderBy(desc(events.createdAt));
}

export async function getOrganizerEvent(id: string) {
  return findOwnedEvent(id);
}

export async function getOrganizerRegistrants(id: string) {
  const event = await findOwnedEvent(id);
  if (!event) return null;
  return getDb().select({ registration: registrations }).from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .where(and(eq(events.id, event.id), eq(events.workspaceId, event.workspaceId), isNull(events.deletedAt)))
    .orderBy(desc(registrations.createdAt)).then((rows) => rows.map((row) => row.registration));
}
