import { Suspense } from "react";
import { contentApiUrl } from "@/lib/content-management";

type PublishedImage = { id: string; originalName: string; contentType: string; url: string };

export default function PublishedMediaSection({ location, title }: { location: string; title: string }) {
  return (
    <Suspense fallback={<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><div className="aspect-[4/3] animate-pulse rounded-[20px] bg-zinc-100" /><div className="aspect-[4/3] animate-pulse rounded-[20px] bg-zinc-100" /><div className="aspect-[4/3] animate-pulse rounded-[20px] bg-zinc-100" /></div>}>
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
    });

    if (!response.ok) return null;

    const images = (await response.json()) as PublishedImage[];
    if (images.length === 0) return null;

    return (
      <section>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900">{title}</h2>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <figure key={image.id} className="group overflow-hidden rounded-[20px] border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all hover:border-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={contentApiUrl(image.url)} alt={image.originalName} className="aspect-[4/3] w-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
            </figure>
          ))}
        </div>
      </section>
    );
  } catch {
    return null;
  }
}
