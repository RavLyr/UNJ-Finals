import Link from "next/link";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/event-form";
import { EventLifecycleActions } from "@/components/event-lifecycle-actions";
import { getOrganizerEvent } from "@/server/queries/organizer";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getOrganizerEvent(id);
  if (!event) notFound();
  const preview = process.env.VERCEL_ENV === "preview";

  return <>
    <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-sm text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Kembali ke daftar event</Link>
    <div>
      <h1 className="text-2xl font-bold">{event.status === "completed" ? "Arsip event" : "Edit event"}</h1>
      <p className="mt-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{event.title}</p>
    </div>
    <EventForm key={`${event.id}-${event.status}`} event={event} preview={preview} />
    <div className="max-w-3xl border-t pt-6">
      <EventLifecycleActions key={`${event.id}-${event.status}`} event={event} preview={preview} />
    </div>
  </>;
}
