import type { NextAuthConfig } from "next-auth";
import type { User } from "@/lib/types";

export function authDestination(role: User["role"], returnUrl?: unknown): string {
  if (role === "organizer") return "/dashboard";
  if (role === "platform_admin") return "/admin";
  // Only canonical public event paths may override the attendee destination.
  return typeof returnUrl === "string" && /^\/w\/[a-z0-9]+(?:-[a-z0-9]+)*\/events\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(returnUrl)
    ? returnUrl
    : "/tickets";
}

export default {
  providers: [],
  pages: { signIn: "/signin" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub && (token.role === "organizer" || token.role === "attendee" || token.role === "platform_admin")) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
