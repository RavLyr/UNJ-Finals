"use server";

import "server-only";
import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { registrationSchema } from "@/lib/validations";
import { generateTicketId } from "@/lib/ticket-id";
import type { ActionResult } from "@/lib/types";
import { getDb } from "@/server/db";
import { events, registrations, workspaces } from "@/server/db/schema";
import {
  actionFailure, eventIdSchema, previewMutationGuard, revalidateEventPaths, validationFailure,
} from "./helpers";

const participantSchema = registrationSchema.extend({ eventId: eventIdSchema });

export async function registerParticipant(
  _prevState: ActionResult<{ ticketId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ ticketId: string }>> {
  const preview = previewMutationGuard();
  if (preview) return preview;
  let currentUrl: string | undefined;
  let ticketId: string | undefined;
  try {
    const id = eventIdSchema.safeParse(formData.get("eventId"));
    if (!id.success) return validationFailure(id.error);
    const session = await auth();
    if (!session?.user) {
      const [event] = await getDb().select({ slug: events.slug, workspaceSlug: workspaces.slug })
        .from(events).innerJoin(workspaces, eq(events.workspaceId, workspaces.id))
        .where(and(eq(events.id, id.data), eq(events.status, "published"), isNull(events.deletedAt)));
      if (!event) return { success: false, error: "Event tidak ditemukan" };
      currentUrl = `/w/${encodeURIComponent(event.workspaceSlug)}/events/${encodeURIComponent(event.slug)}`;
    } else {
      if (session.user.role !== "attendee" || !eventIdSchema.safeParse(session.user.id).success) {
        return { success: false, error: "Akses attendee diperlukan" };
      }
      const parsed = participantSchema.safeParse(Object.fromEntries(formData));
      if (!parsed.success) return validationFailure(parsed.error);
      const result = await getDb().transaction(async (tx) => {
        const [event] = await tx.select().from(events).where(and(
          eq(events.id, parsed.data.eventId), eq(events.status, "published"), isNull(events.deletedAt),
        )).for("update");
        if (!event) return { success: false as const, error: "Event tidak ditemukan" };
        const [reserved] = await tx.update(events).set({
          registeredCount: sql`${events.registeredCount} + 1`, updatedAt: sql`now()`,
        }).where(and(
          eq(events.id, event.id), eq(events.status, "published"), isNull(events.deletedAt),
          lt(events.registeredCount, events.maxQuota),
        )).returning({ id: events.id });
        if (!reserved) return { success: false as const, error: "Kuota sudah habis" };
        for (let attempt = 0; attempt < 2; attempt++) {
          const [registration] = await tx.insert(registrations).values({
            eventId: event.id, attendeeId: session.user.id,
            name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone ?? null,
            ticketId: generateTicketId(),
          }).onConflictDoNothing({ target: registrations.ticketId })
            .returning({ ticketId: registrations.ticketId });
          if (registration) {
            const [workspace] = await tx.select({ slug: workspaces.slug }).from(workspaces)
              .where(eq(workspaces.id, event.workspaceId));
            if (!workspace) throw new Error("Event workspace not found");
            return { success: true as const, event, workspaceSlug: workspace.slug, ticketId: registration.ticketId };
          }
        }
        // Throw to roll back the reserved quota after both ticket collisions.
        throw new Error("Ticket ID collision after retry");
      });
      if (!result.success) return result;
      ticketId = result.ticketId;
      revalidateEventPaths(result.workspaceSlug, result.event);
    }
  } catch (error) {
    // Drizzle wraps postgres.js errors in cause; match only the event-email index.
    const cause = error instanceof Error && error.cause ? error.cause : error;
    if (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "23505" &&
      "constraint_name" in cause && cause.constraint_name === "registrations_event_email_unique") {
      return { success: false, error: "Email sudah terdaftar" };
    }
    return actionFailure(error);
  }
  if (currentUrl) redirect(`/signin?redirect=${encodeURIComponent(currentUrl)}`);
  // ?registered=1 signals the ticket page to fire the CONTRACT §9 success toasts.
  redirect(`/tickets/${ticketId}?registered=1`);
}
