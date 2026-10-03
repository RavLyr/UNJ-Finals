import type { User } from "./types";

export function isReservedAdminEmail(email: string): boolean {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",").map((value) => value.trim().toLowerCase()).filter(Boolean)
    .includes(email.trim().toLowerCase());
}

// Email strings from public signup are not proof of mailbox ownership.
// Admin access requires an explicitly provisioned DB role AND the allowlist.
export function accountRole(email: string, role: User["role"]): User["role"] {
  if (role !== "platform_admin") return role;
  return isReservedAdminEmail(email) ? "platform_admin" : "attendee";
}
