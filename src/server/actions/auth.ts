"use server";

import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { signIn, accountRole, credentialsSchema, previewNotice } from "@/lib/auth";
import { authDestination } from "@/lib/auth.config";
import { registrationSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/types";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";

const signupSchema = credentialsSchema.extend({
  name: registrationSchema.shape.name,
  role: z.enum(["organizer", "attendee"], { message: "Pilih jenis akun" }),
  confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"], message: "Konfirmasi kata sandi tidak cocok",
});

function validationFailure(error: z.ZodError): ActionResult<null> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0]);
    fieldErrors[field] ??= issue.message;
  }
  return { success: false, error: "Periksa kembali data Anda.", fieldErrors };
}

export async function signInAction(
  _previous: ActionResult<null> | null, formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      const preview = "code" in error && error.code === "preview_read_only";
      return { success: false, error: preview ? previewNotice : "Email atau kata sandi salah. Silakan coba lagi." };
    }
    throw error;
  }
  // auth() reads incoming headers, not the cookie just set by signIn().
  const [user] = await getDb().select({ role: users.role }).from(users)
    .where(eq(users.email, parsed.data.email)).limit(1);
  if (!user) return { success: false, error: "Gagal masuk. Silakan coba lagi." };
  redirect(authDestination(accountRole(parsed.data.email, user.role), formData.get("redirect")));
}

export async function registerAccount(
  _previous: ActionResult<null> | null, formData: FormData,
): Promise<ActionResult<null>> {
  if (process.env.VERCEL_ENV === "preview") return { success: false, error: previewNotice };
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const { name, email, password, role } = parsed.data;
  try {
    const passwordHash = await hash(password, 12);
    const [created] = await getDb().insert(users).values({ name, email, passwordHash, role: accountRole(email, role) })
      .onConflictDoNothing({ target: users.email }).returning({ id: users.id });
    if (!created) return { success: false, error: "Email sudah terdaftar", fieldErrors: { email: "Email sudah terdaftar" } };
  } catch {
    return { success: false, error: "Pendaftaran gagal. Silakan coba lagi." };
  }
  revalidatePath("/register");
  const destination = authDestination("attendee", formData.get("redirect"));
  redirect(`/signin?registered=1${destination !== "/tickets" ? `&redirect=${encodeURIComponent(destination)}` : ""}`);
}
