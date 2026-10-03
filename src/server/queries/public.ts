import "server-only";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { Event, Workspace } from "@/lib/types";
import { getDb } from "@/server/db";
import { events, users, workspaces } from "@/server/db/schema";

export type PublishedEvent = { event: Event; workspaceSlug: string };
export type PublicEvent = {
  event: Event;
  workspace: Pick<Workspace, "id" | "name" | "slug">;
  organizerEmail: string;
  organizerName: string | null;
};

export async function getPublishedEvents(): Promise<PublishedEvent[]> {
  return getDb()
    .select({ event: events, workspaceSlug: workspaces.slug })
    .from(events)
    .innerJoin(workspaces, eq(events.workspaceId, workspaces.id))
    .where(and(eq(events.status, "published"), isNull(events.deletedAt)))
    .orderBy(asc(events.dateTime));
}

export async function getEventByWorkspaceSlug(
  workspaceSlug: string,
  eventSlug: string,
): Promise<PublicEvent | null> {
  if (
    typeof workspaceSlug !== "string" ||
    typeof eventSlug !== "string" ||
    !/^[a-z0-9-]+$/i.test(workspaceSlug) ||
    !/^[a-z0-9-]+$/i.test(eventSlug)
  ) return null;

  const [row] = await getDb()
    .select({
      event: events,
      workspace: { id: workspaces.id, name: workspaces.name, slug: workspaces.slug },
      organizerEmail: users.email,
      organizerName: users.name,
    })
    .from(events)
    .innerJoin(workspaces, eq(events.workspaceId, workspaces.id))
    .innerJoin(users, eq(workspaces.ownerId, users.id))
    .where(and(
      eq(workspaces.slug, workspaceSlug),
      eq(events.slug, eventSlug),
      inArray(events.status, ["published", "cancelled", "completed"]),
      isNull(events.deletedAt),
    ));

  return row ?? null;
}
