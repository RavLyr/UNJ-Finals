import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth, previewNotice } from "@/lib/auth";
import type { ActionResult, Event } from "@/lib/types";
import { getDb } from "@/server/db";
import { events, workspaces } from "@/server/db/schema";

export { previewNotice };
export const eventIdSchema = z.string().uuid("ID event tidak valid");

export function previewMutationGuard(): ActionResult<never> | null {
  return process.env.VERCEL_ENV === "preview" ? { success: false, error: previewNotice } : null;
}

export class OrganizerAccessError extends Error {
  constructor() { super("Akses organizer diperlukan"); }
}

export async function requireOrganizerWorkspace() {
  const session = await auth();
  if (session?.user?.role !== "organizer" || !z.string().uuid().safeParse(session.user.id).success) {
    throw new OrganizerAccessError();
  }
  const [workspace] = await getDb().select().from(workspaces)
    .where(eq(workspaces.ownerId, session.user.id)).limit(1);
  if (!workspace) throw new OrganizerAccessError();
  return workspace;
}

export async function findOwnedEvent(id: string) {
  const workspace = await requireOrganizerWorkspace();
  if (!eventIdSchema.safeParse(id).success) return null;
  const [event] = await getDb().select().from(events).where(and(
    eq(events.id, id), eq(events.workspaceId, workspace.id), isNull(events.deletedAt),
  )).limit(1);
  return event ?? null;
}

export function validationFailure(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    fieldErrors[field] ??= issue.message;
  }
  return { success: false, error: "Periksa kembali data formulir", fieldErrors };
}

export function actionFailure(error: unknown): ActionResult<never> {
  return { success: false, error: error instanceof OrganizerAccessError
    ? error.message : "Perubahan gagal disimpan. Silakan coba lagi." };
}

export function canTransitionEvent(from: Event["status"], to: Event["status"]) {
  return (from === "draft" && to === "published") ||
    (from === "published" && (to === "cancelled" || to === "completed"));
}

export function revalidateEventPaths(workspaceSlug: string, event: Pick<Event, "id" | "slug">) {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/events/${event.id}/edit`);
  revalidatePath(`/dashboard/events/${event.id}/registrants`);
  revalidatePath(`/dashboard/events/${event.id}/check-in`);
  revalidatePath(`/w/${workspaceSlug}/events/${event.slug}`);
  revalidatePath("/tickets");
  revalidatePath("/tickets/[ticketId]", "page");
}
