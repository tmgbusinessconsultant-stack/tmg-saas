import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { mediaUrl } from "@/lib/content-management";
import { defaultHomepageContent, type HomepageContent } from "@/lib/homepage-content";
import PublishedMediaSection from "@/components/published-media-section";

async function loadHomepageContent(): Promise<HomepageContent> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    if (!base) return defaultHomepageContent;

    const response = await fetch(`${base}/content/homepage`, {
      cache: "no-store",
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.warn(`Homepage API returned ${response.status}, using fallback`);
      return defaultHomepageContent;
    }

    const body = await response.text();
    if (!body.trim()) return defaultHomepageContent;

    let value: Partial<HomepageContent> | null;
    try {
      value = JSON.parse(body) as Partial<HomepageContent> | null;
    } catch {
      console.warn("Homepage content was not valid JSON, using fallback");
      return defaultHomepageContent;
    }

    if (!value) return defaultHomepageContent;

    return {
      ...defaultHomepageContent,
      ...value,
      hero: { ...defaultHomepageContent.hero, ...value.hero },
      quickCard: { ...defaultHomepageContent.quickCard, ...value.quickCard },
      services: { ...defaultHomepageContent.services, ...value.services },
      about: { ...defaultHomepageContent.about, ...value.about },
      testimonials: { ...defaultHomepageContent.testimonials, ...value.testimonials },
      cta: { ...defaultHomepageContent.cta, ...value.cta },
    };
  } catch (e) {
    console.warn("Could not load homepage content, using default:", e);
    return defaultHomepageContent; // NEVER THROW - always return default
  }
}

export default function Home() {
  return (
    <Suspense fallback={<HomePageContent content={defaultHomepageContent} />}>
      <LiveHomepageContent />
    </Suspense>
  );
}

async function LiveHomepageContent() {
  const content = await loadHomepageContent();
  return <HomePageContent content={content} />;
}

// ... rest of your HomePageContent component stays same