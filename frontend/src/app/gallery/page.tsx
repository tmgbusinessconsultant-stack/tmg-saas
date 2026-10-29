import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import type { Metadata } from "next";
import { contentApiUrl, type CmsGalleryItem } from "@/lib/content-management";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery | TMG Business Consulting",
  description: "Selected public work and visual stories from TMG Business Consulting — branding, strategy, and digital transformations for SMEs in Qatar.",
  alternates: { canonical: "https://tmgbusinessconsulting.com/gallery" },
  openGraph: {
    title: "Gallery | TMG Business Consulting",
    description: "Selected work from TMG — see how we help businesses scale.",
    url: "https://tmgbusinessconsulting.com/gallery",
    type: "website",
  },
};

export default function GalleryPage() {
  return (
    <main className="mx-auto px-6 py-16" style={{ maxWidth: "var(--container-max)" }}>
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--gold)" }}>Our work</p>
        <h1 className="mt-3 font-bold" style={{ fontSize: "var(--h1-size)", fontFamily: "var(--font-family)", lineHeight: "var(--line-height)" }}>Gallery</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Selected public work and visual stories from TMG Business Consulting.</p>
      </div>

      <Suspense fallback={<GallerySkeleton />}>
        <GalleryItems />
      </Suspense>

      <p className="mt-10 text-center">
        <Link href="/contact" className="inline-flex items-center justify-center px-6 font-semibold text-white hover:opacity-90 transition" style={{ background: "var(--primary)", borderRadius: "var(--button-radius)", minHeight: "var(--button-height)" }}>
          Discuss a project with TMG
        </Link>
      </p>
    </main>
  );
}

async function GalleryItems() {
  try {
    const response = await fetch(contentApiUrl("/gallery"), { cache: "no-store", next: { revalidate: 0 } });
    if (!response.ok) {
      console.error(`Gallery API ${response.status}`);
      return <EmptyState message="Could not load gallery right now. Please try again later." />;
    }
    const items = (await response.json()) as Array<CmsGalleryItem & { image: string }>;

    if (items.length === 0) {
      return <EmptyState message="Gallery items will be added soon." />;
    }

    return (
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="group overflow-hidden border bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{
              borderRadius: "var(--radius)",
              borderWidth: "var(--border-width)",
              borderColor: "var(--border-color)",
              background: "var(--card-bg)",
            }}
          >
            <div className="overflow-hidden">
              <Image
                src={contentApiUrl(item.image)}
                alt={item.title || "TMG portfolio item"}
                width={1200}
                height={900}
                unoptimized
                className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            </div>
            <div className="p-5">
              {item.category && (
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--gold)" }}>
                  {item.category}
                </p>
              )}
              <h2 className="mt-2 text-xl font-bold line-clamp-2" style={{ fontFamily: "var(--font-family)" }}>{item.title}</h2>
              <p className="mt-2 leading-6 text-slate-600 line-clamp-3">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    );
  } catch (err) {
    console.error("Gallery load failed", err);
    return <EmptyState message="Gallery temporarily unavailable." />;
  }
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: "var(--border-color)", background: "var(--card-bg)" }}>
      <p className="text-slate-500">{message}</p>
      <Link href="/contact" className="mt-4 text-sm font-semibold underline" style={{ color: "var(--primary)" }}>Contact us to see more work</Link>
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-2xl border bg-white">
          <div className="aspect-[4/3] w-full bg-slate-200" />
          <div className="p-5 space-y-3">
            <div className="h-3 w-20 bg-slate-200 rounded" />
            <div className="h-5 w-full bg-slate-200 rounded" />
            <div className="h-4 w-3/4 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
