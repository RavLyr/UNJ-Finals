import "./luma.css";
import { and, asc, eq, isNull } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { EventsSection } from "@/components/events-section";
import { CtaSection } from "@/components/cta-section";
import { getDb } from "@/server/db";
import { events, workspaces } from "@/server/db/schema";
import type { Event } from "@/lib/types";

export default async function LandingPage() {
  const rows = await getDb()
    .select({ event: events, workspaceSlug: workspaces.slug })
    .from(events)
    .innerJoin(workspaces, eq(events.workspaceId, workspaces.id))
    .where(and(eq(events.status, "published"), isNull(events.deletedAt)))
    .orderBy(asc(events.dateTime));

  const publishedEvents = rows.map((row) => ({
    event: row.event as Event,
    workspaceSlug: row.workspaceSlug,
  }));

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <EventsSection events={publishedEvents} />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
