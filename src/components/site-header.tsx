import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { authDestination } from "@/lib/auth.config";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/" });
}

const roleLabels = {
  organizer: "Organizer",
  attendee: "Peserta",
  platform_admin: "Platform Admin",
} as const;

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  const displayName = user?.name?.trim() || user?.email || "Akun Anda";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="nav">
      <div className="nav__inner">
        <Link href="/" className="nav__logo">
          RuangAcara
        </Link>
        <nav className="nav__links" aria-label="Navigasi utama">
          <Link href="/" className="nav__link">
            Jelajahi Event
          </Link>
          {user && (
            <Link href={authDestination(user.role)} className="nav__link">
              {user.role === "organizer" ? "Dashboard" : "Tiket Saya"}
            </Link>
          )}
        </nav>
        <div className="nav__actions">
          {user ? (
            <>
              <Link
                href={authDestination(user.role)}
                className="nav__user"
                title={`${displayName} — ${roleLabels[user.role]}`}
              >
                <span className="nav__avatar" aria-hidden="true">
                  {initial}
                </span>
                <span className="nav__user-text">
                  <span className="nav__user-name">{displayName}</span>
                  <span className="nav__user-role">{roleLabels[user.role]}</span>
                </span>
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="btn btn--secondary btn--small">
                  Keluar
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/signin" className="btn btn--secondary btn--small">
                Masuk
              </Link>
              <Link href="/register" className="btn btn--primary btn--small">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}