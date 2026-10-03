import Link from "next/link";
import { EventForm } from "@/components/event-form";
import { requireOrganizerWorkspace } from "@/server/actions/helpers";

export default async function NewEventPage() {
  await requireOrganizerWorkspace();
  return <>
    <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-sm text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Kembali ke daftar event</Link>
    <div>
      <h1 className="text-2xl font-bold">Buat event</h1>
      <p className="mt-1 text-sm text-muted-foreground">Event disimpan sebagai draf. Publikasikan setelah detail siap.</p>
    </div>
    <EventForm preview={process.env.VERCEL_ENV === "preview"} />
  </>;
}
