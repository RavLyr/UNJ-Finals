import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { authDestination } from "@/lib/auth.config";
import { requireOrganizerWorkspace } from "@/server/actions/helpers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?redirect=%2Fdashboard");
  if (session.user.role !== "organizer") redirect(authDestination(session.user.role));
  const workspace = await requireOrganizerWorkspace();

  return (
    <div className="min-w-0">
      <a href="#dashboard-content" className="sr-only focus:not-sr-only focus:block focus:p-3 focus:underline">
        Lewati ke konten
      </a>
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
          <Link href="/" className="rounded-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            RuangAcara
          </Link>
          <p className="min-w-0 flex-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
            {workspace.name}
          </p>
          <nav aria-label="Navigasi organizer" className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/dashboard" className="rounded-sm font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Event
            </Link>
            <Link href="/" className="rounded-sm text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Jelajahi event
            </Link>
          </nav>
        </div>
      </header>
      <main id="dashboard-content" className="mx-auto w-full min-w-0 max-w-[1280px] space-y-6 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
