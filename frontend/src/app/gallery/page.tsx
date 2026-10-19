import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { contentApiUrl, type CmsGalleryItem } from "@/lib/content-management";

export default function GalleryPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Our work</p>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">Gallery</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Selected public work and visual stories from TMG Business Consulting.</p>
      </div>
      <Suspense fallback={<p className="mt-12 text-center text-slate-500" role="status">Loading gallery...</p>}>
        <GalleryItems />
      </Suspense>
      <p className="mt-10 text-center"><Link href="/contact" className="font-semibold underline">Discuss a project with TMG</Link></p>
    </main>
  );
}

async function GalleryItems() {
  const response = await fetch(contentApiUrl("/gallery"), { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load the gallery (${response.status}).`);
  const items = await response.json() as Array<CmsGalleryItem & { image: string }>;

  return (
    <>
      {items.length === 0 ? <p className="mt-12 text-center text-slate-500">Gallery items will be added soon.</p> : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Image src={contentApiUrl(item.image)} alt={item.title} width={1200} height={900} unoptimized className="aspect-[4/3] w-full object-cover" />
            <div className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-[#8A6A00]">{item.category}</p><h2 className="mt-2 text-xl font-bold">{item.title}</h2><p className="mt-2 leading-6 text-slate-600">{item.description}</p></div>
          </article>)}
        </div>
      )}
    </>
  );
}
