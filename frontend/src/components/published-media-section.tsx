import { Suspense } from "react";
import { contentApiUrl } from "@/lib/content-management";

type PublishedImage = { id: string; originalName: string; contentType: string; url: string };

export default function PublishedMediaSection({ location, title }: { location: string; title: string }) {
  return (
    <Suspense fallback={null}>
      <PublishedMediaContent location={location} title={title} />
    </Suspense>
  );
}

async function PublishedMediaContent({ location, title }: { location: string; title: string }) {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!base) return null;

    const response = await fetch(contentApiUrl(`/content/media?location=${encodeURIComponent(location)}`), {
      cache: "no-store",
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.warn(`Media API returned ${response.status} for ${location}, skipping section`);
      return null;
    }

    const images = await response.json() as PublishedImage[];
    if (images.length === 0) return null;

    return (
      <section className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <figure key={image.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={contentApiUrl(image.url)} alt={image.originalName} className="aspect-[4/3] w-full object-cover" />
            </figure>
          ))}
        </div>
      </section>
    );
  } catch (e) {
    console.warn(`Could not load published ${location} media, skipping:`, e);
    return null; // NEVER THROW - just hide section if backend down
  }
}