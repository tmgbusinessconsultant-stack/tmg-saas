import { Suspense } from "react";
import Image from "next/image";
import { contentApiUrl } from "@/lib/content-management";

type PublishedImage = { id: string; originalName: string; contentType: string; url: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPublishedImage(value: unknown): value is PublishedImage {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.originalName === "string"
    && typeof value.contentType === "string"
    && typeof value.url === "string";
}

export default function PublishedMediaSection({ location, title }: { location: string; title: string }) {
  return (
    <Suspense fallback={<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><div className="aspect-[4/3] animate-pulse rounded-[20px] bg-zinc-100" /><div className="aspect-[4/3] animate-pulse rounded-[20px] bg-zinc-100" /><div className="aspect-[4/3] animate-pulse rounded-[20px] bg-zinc-100" /></div>}>
      <PublishedMediaContent location={location} title={title} />
    </Suspense>
  );
}

async function PublishedMediaContent({ location, title }: { location: string; title: string }) {
  const images = await loadPublishedImages(location);
  if (!images?.length) return null;

  return (
    <section>
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900">{title}</h2>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <figure key={image.id} className="group overflow-hidden rounded-[20px] border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all hover:border-zinc-900">
            <Image src={contentApiUrl(image.url)} alt={image.originalName} width={1200} height={900} unoptimized className="aspect-[4/3] w-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
          </figure>
        ))}
      </div>
    </section>
  );
}

async function loadPublishedImages(location: string): Promise<PublishedImage[] | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!base) return null;

    const response = await fetch(contentApiUrl(`/content/media?location=${encodeURIComponent(location)}`), {
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`Published media request failed (${response.status}).`);
    const data: unknown = await response.json();
    if (!Array.isArray(data) || !data.every(isPublishedImage)) throw new Error("Published media response has an invalid format.");
    return data;
  } catch (error: unknown) {
    console.error("Could not load published media.", error);
    return null;
  }
}
