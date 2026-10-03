import "server-only";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import authConfig from "@/lib/auth.config";
import { registrationSchema } from "@/lib/validations";
import { generateSlug } from "@/lib/slug";
import { getDb } from "@/server/db";
import { users, workspaces } from "@/server/db/schema";

export const previewNotice = "Mode pratinjau: perubahan dan pendaftaran dinonaktifkan.";

export const credentialsSchema = z.object({
  email: registrationSchema.shape.email,
  password: z.string().min(1, "Kata sandi wajib diisi").refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Kata sandi maksimal 72 byte",
  ),
});

export function accountRole(email: string, role: typeof users.$inferSelect.role) {
  const allowlist = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return allowlist.includes(email) ? "platform_admin" : role === "platform_admin" ? "attendee" : role;
}

class PreviewBootstrapError extends CredentialsSignin {
  code = "preview_read_only";
}

async function bootstrapWorkspace(user: typeof users.$inferSelect) {
  const db = getDb();
  const [existing] = await db.select({ id: workspaces.id }).from(workspaces)
    .where(eq(workspaces.ownerId, user.id)).limit(1);
  if (existing) return;
  if (process.env.VERCEL_ENV === "preview") throw new PreviewBootstrapError();

  const created = await db.transaction(async (tx) => {
    // Serialize first logins for this owner; DB uniqueness handles other owners' slugs.
    await tx.select({ id: users.id }).from(users).where(eq(users.id, user.id)).for("update");
    const [workspace] = await tx.select({ id: workspaces.id }).from(workspaces)
      .where(eq(workspaces.ownerId, user.id)).limit(1);
    if (workspace) return;
    const name = user.name;
    if (!name) throw new Error("Organizer name is required for workspace bootstrap");
    const baseSlug = generateSlug(name);
    for (let suffix = 0; ; suffix++) {
      const slug = baseSlug ? `${baseSlug}${suffix ? `-${suffix}` : ""}` : String(suffix + 1);
      const [created] = await tx.insert(workspaces).values({ ownerId: user.id, name, slug })
        .onConflictDoNothing().returning({ id: workspaces.id });
      if (created) return true;
    }
  });
  if (created) revalidatePath("/dashboard");
}

export const { auth, handlers, signIn, signOut } = NextAuth(() => ({
  ...authConfig,
  // ponytail: credentials + JWT never call adapter persistence. OAuth/database
  // sessions require an approved adapter schema before enabling those providers.
  adapter: DrizzleAdapter(getDb()),
  providers: [Credentials({
    credentials: { email: { type: "email" }, password: { type: "password" } },
    async authorize(credentials) {
      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) return null;
      const [user] = await getDb().select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
      if (!user?.passwordHash || !await compare(parsed.data.password, user.passwordHash)) return null;
      const role = accountRole(user.email, user.role);
      if (role === "organizer") await bootstrapWorkspace(user);
      return { id: user.id, email: user.email, name: user.name, image: user.image, role };
    },
  })],
}));
