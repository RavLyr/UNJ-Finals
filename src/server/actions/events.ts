"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { eventSchema, eventStatusSchema } from "@/lib/validations";
import { generateSlug } from "@/lib/slug";
import type { ActionResult } from "@/lib/types";
import { getDb } from "@/server/db";
import { events } from "@/server/db/schema";
import {
  actionFailure, canTransitionEvent, eventIdSchema, previewMutationGuard,
  requireOrganizerWorkspace, revalidateEventPaths, validationFailure,
} from "./helpers";

const fullEventSchema = eventSchema.extend({
  title: eventSchema.shape.title.min(5, "Judul minimal 5 karakter"),
  description: eventSchema.shape.description.min(10, "Deskripsi minimal 10 karakter"),
  maxQuota: eventSchema.shape.maxQuota.max(10000, "Kuota maksimal 10000"),
  bannerUrl: eventSchema.shape.bannerUrl.refine(
    (value) => !value || value.startsWith("https://"), "URL banner harus HTTPS",
  ),
});
const metadataSchema = fullEventSchema.pick({
  title: true, description: true, speaker: true, bannerUrl: true, tags: true,
}).extend({ cancellationReason: eventStatusSchema.shape.cancellationReason });

export async function createEvent(
  _prevState: ActionResult<{ eventId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ eventId: string }>> {
  const preview = previewMutationGuard();
  if (preview) return preview;
  try {
    const workspace = await requireOrganizerWorkspace();
    const parsed = fullEventSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return validationFailure(parsed.error);
    if (parsed.data.dateTime <= new Date()) return {
      success: false, error: "Tanggal event harus di masa depan", fieldErrors: { dateTime: "Tanggal event harus di masa depan" },
    };
    const baseSlug = generateSlug(parsed.data.title);
    const event = await getDb().transaction(async (tx) => {
      for (let suffix = 0; ; suffix++) {
        const slug = baseSlug ? `${baseSlug}${suffix ? `-${suffix}` : ""}` : String(suffix + 1);
        const [created] = await tx.insert(events).values({
          ...parsed.data, workspaceId: workspace.id, slug, status: "draft",
        }).onConflictDoNothing({
          target: [events.workspaceId, events.slug], where: sql`${events.deletedAt} is null`,
        }).returning({ id: events.id, slug: events.slug });
        if (created) return created;
      }
    });
    revalidateEventPaths(workspace.slug, event);
  } catch (error) { return actionFailure(error); }
  redirect("/dashboard");
}

export async function updateEvent(
  _prevState: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const preview = previewMutationGuard();
  if (preview) return preview;
  try {
    const workspace = await requireOrganizerWorkspace();
    const id = eventIdSchema.safeParse(formData.get("eventId"));
    if (!id.success) return validationFailure(id.error);
    const result = await getDb().transaction(async (tx): Promise<ActionResult<null>> => {
      const [event] = await tx.select().from(events).where(and(
        eq(events.id, id.data), eq(events.workspaceId, workspace.id), isNull(events.deletedAt),
      )).for("update");
      if (!event) return { success: false, error: "Event tidak ditemukan" };
      if (event.status === "completed") return { success: false, error: "Event selesai tidak dapat diubah" };
      const input = Object.fromEntries(formData);
      if (event.status === "cancelled") {
        const parsed = metadataSchema.safeParse(input);
        if (!parsed.success) return validationFailure(parsed.error);
        if (!parsed.data.cancellationReason) return {
          success: false, error: "Alasan pembatalan wajib diisi", fieldErrors: { cancellationReason: "Alasan pembatalan wajib diisi" },
        };
        await tx.update(events).set({
          ...parsed.data, speaker: parsed.data.speaker ?? null, bannerUrl: parsed.data.bannerUrl ?? null,
          tags: parsed.data.tags ?? null, updatedAt: new Date(),
        }).where(eq(events.id, event.id));
      } else {
        const parsed = fullEventSchema.safeParse(input);
        if (!parsed.success) return validationFailure(parsed.error);
        if (parsed.data.maxQuota < event.registeredCount) return {
          success: false, error: "Kuota tidak boleh kurang dari jumlah peserta",
          fieldErrors: { maxQuota: "Kuota tidak boleh kurang dari jumlah peserta" },
        };
        await tx.update(events).set({
          ...parsed.data, speaker: parsed.data.speaker ?? null, bannerUrl: parsed.data.bannerUrl ?? null,
          tags: parsed.data.tags ?? null, updatedAt: new Date(),
        }).where(eq(events.id, event.id));
      }
      return { success: true, data: null };
    });
    if (result.success) {
      const [event] = await getDb().select({ id: events.id, slug: events.slug }).from(events)
        .where(and(eq(events.id, id.data), eq(events.workspaceId, workspace.id), isNull(events.deletedAt)));
      if (event) revalidateEventPaths(workspace.slug, event);
    }
    return result;
  } catch (error) { return actionFailure(error); }
}

export async function setEventStatus(
  _prevState: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const preview = previewMutationGuard();
  if (preview) return preview;
  try {
    const workspace = await requireOrganizerWorkspace();
    const id = eventIdSchema.safeParse(formData.get("eventId"));
    if (!id.success) return validationFailure(id.error);
    const parsed = eventStatusSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return validationFailure(parsed.error);
    const result = await getDb().transaction(async (tx): Promise<ActionResult<null>> => {
      const [event] = await tx.select().from(events).where(and(
        eq(events.id, id.data), eq(events.workspaceId, workspace.id), isNull(events.deletedAt),
      )).for("update");
      if (!event) return { success: false, error: "Event tidak ditemukan" };
      if (!canTransitionEvent(event.status, parsed.data.status)) return { success: false, error: "Perubahan status tidak diizinkan" };
      if (parsed.data.status === "published") {
        const valid = fullEventSchema.safeParse(event);
        if (!valid.success) return validationFailure(valid.error);
        if (event.dateTime <= new Date()) return { success: false, error: "Tanggal event harus di masa depan" };
      }
      if (parsed.data.status === "cancelled" && !parsed.data.cancellationReason) return {
        success: false, error: "Alasan pembatalan wajib diisi", fieldErrors: { cancellationReason: "Alasan pembatalan wajib diisi" },
      };
      await tx.update(events).set({
        status: parsed.data.status,
        cancellationReason: parsed.data.status === "cancelled" ? parsed.data.cancellationReason : null,
        updatedAt: new Date(),
      }).where(eq(events.id, event.id));
      return { success: true, data: null };
    });
    if (result.success) {
      const [event] = await getDb().select({ id: events.id, slug: events.slug }).from(events)
        .where(and(eq(events.id, id.data), eq(events.workspaceId, workspace.id), isNull(events.deletedAt)));
      if (event) revalidateEventPaths(workspace.slug, event);
    }
    return result;
  } catch (error) { return actionFailure(error); }
}

export async function deleteEvent(
  _prevState: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const preview = previewMutationGuard();
  if (preview) return preview;
  try {
    const workspace = await requireOrganizerWorkspace();
    const id = eventIdSchema.safeParse(formData.get("eventId"));
    if (!id.success) return validationFailure(id.error);
    const event = await getDb().transaction(async (tx) => {
      const [event] = await tx.select().from(events).where(and(
        eq(events.id, id.data), eq(events.workspaceId, workspace.id), isNull(events.deletedAt),
      )).for("update");
      if (!event) return null;
      await tx.update(events).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(events.id, event.id));
      return event;
    });
    if (!event) return { success: false, error: "Event tidak ditemukan" };
    revalidateEventPaths(workspace.slug, event);
    return { success: true, data: null };
  } catch (error) { return actionFailure(error); }
}
