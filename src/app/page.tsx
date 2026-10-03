import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { EventsSection } from "@/components/events-section";
import { CtaSection } from "@/components/cta-section";
import { getPublishedEvents } from "@/server/queries/public";

// DB query at request time — never prerender at build (CI has no DATABASE_URL).
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const publishedEvents = await getPublishedEvents();

  return (
    <div className="landing-page">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <EventsSection events={publishedEvents} />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
