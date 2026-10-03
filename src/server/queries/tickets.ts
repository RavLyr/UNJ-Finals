import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getDb } from "@/server/db";
import { events, registrations, workspaces } from "@/server/db/schema";

async function requireAttendeeId() {
  const session = await auth();
  if (session?.user?.role !== "attendee" || !z.string().uuid().safeParse(session.user.id).success) {
    throw new Error("Akses peserta diperlukan");
  }
  return session.user.id;
}

// CONTRACT §2: tickets remain accessible after event soft deletion.
export async function getAttendeeTickets() {
  const attendeeId = await requireAttendeeId();
  return getDb()
    .select({
      ticketId: registrations.ticketId,
      eventTitle: events.title,
      eventSlug: events.slug,
      eventDateTime: events.dateTime,
      eventSpeaker: events.speaker,
      eventStatus: events.status,
      workspaceSlug: workspaces.slug,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(workspaces, eq(events.workspaceId, workspaces.id))
    .where(eq(registrations.attendeeId, attendeeId))
    .orderBy(desc(registrations.createdAt));
}

export async function getAttendeeTicket(ticketId: string) {
  const attendeeId = await requireAttendeeId();
  const [row] = await getDb()
    .select({
      ticketId: registrations.ticketId,
      attendeeId: registrations.attendeeId,
      name: registrations.name,
      email: registrations.email,
      eventTitle: events.title,
      eventDateTime: events.dateTime,
      eventSpeaker: events.speaker,
      eventStatus: events.status,
      workspaceSlug: workspaces.slug,
      eventSlug: events.slug,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(workspaces, eq(events.workspaceId, workspaces.id))
    .where(and(eq(registrations.ticketId, ticketId), eq(registrations.attendeeId, attendeeId)))
    .limit(1);
  return row ?? null;
}
