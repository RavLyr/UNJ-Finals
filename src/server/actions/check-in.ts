"use server";

import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { formatEventDate } from "@/lib/format-date";
import type { ActionResult } from "@/lib/types";
import { getDb } from "@/server/db";
import { events, registrations } from "@/server/db/schema";
import {
  actionFailure, eventIdSchema, previewMutationGuard, requireOrganizerWorkspace,
  revalidateEventPaths, validationFailure,
} from "./helpers";

const checkInSchema = z.object({
  eventId: eventIdSchema,
  ticketId: z.string().regex(/^WBN-\d{8}-[A-Z0-9]{4}$/, "ID tiket tidak valid"),
});

export async function checkIn(
  _prevState: ActionResult<{ name: string; ticketId: string; checkedInAt: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ name: string; ticketId: string; checkedInAt: string }>> {
  const preview = previewMutationGuard();
  if (preview) return preview;
  try {
    const workspace = await requireOrganizerWorkspace();
    const parsed = checkInSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return validationFailure(parsed.error);
    const result = await getDb().transaction(async (tx) => {
      const [event] = await tx.select().from(events).where(and(
        eq(events.id, parsed.data.eventId), eq(events.workspaceId, workspace.id), isNull(events.deletedAt),
      )).for("update");
      if (!event) return { success: false as const, error: "Event tidak ditemukan" };
      if (event.status === "cancelled" || event.status === "completed") {
        return { success: false as const, error: "Event tidak valid untuk check-in" };
      }
      const match = and(eq(registrations.eventId, event.id), eq(registrations.ticketId, parsed.data.ticketId));
      const [registration] = await tx.update(registrations).set({ checkedInAt: sql`now()` })
        .where(and(match, isNull(registrations.checkedInAt))).returning();
      if (!registration) {
        const [existing] = await tx.select({ checkedInAt: registrations.checkedInAt }).from(registrations).where(match);
        return { success: false as const, error: existing?.checkedInAt
          ? `Sudah check-in pada ${formatEventDate(existing.checkedInAt)}` : "Tiket tidak ditemukan" };
      }
      if (!registration.checkedInAt) throw new Error("Check-in timestamp not returned");
      return { success: true as const, event, data: {
        name: registration.name, ticketId: registration.ticketId,
        checkedInAt: registration.checkedInAt.toISOString(),
      } };
    });
    if (!result.success) return result;
    revalidateEventPaths(workspace.slug, result.event);
    return { success: true, data: result.data };
  } catch (error) { return actionFailure(error); }
}
