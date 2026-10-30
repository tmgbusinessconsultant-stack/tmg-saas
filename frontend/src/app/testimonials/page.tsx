export const dynamic = 'force-dynamic';
import Link from "next/link";
import { defaultHomepageContent, type HomepageContent } from "@/lib/homepage-content";
import { mediaUrl } from "@/lib/content-management";

async function loadContent(): Promise<HomepageContent> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    if (!base) return defaultHomepageContent;
    const res = await fetch(`${base}/content/homepage`, { cache: "no-store" });
    if (!res.ok) return defaultHomepageContent;
    const data = await res.json();
    return {
      ...defaultHomepageContent,
      ...data,
      testimonials: {
        ...defaultHomepageContent.testimonials,
        ...data.testimonials,
        items: data.testimonials?.items ?? defaultHomepageContent.testimonials.items,
      },
    } as HomepageContent;
  } catch {
    return defaultHomepageContent;
  }
}

export default async function TestimonialsPage() {
  const content = await loadContent();
  const approved = (content.testimonials.items || []).filter((t: any) => t.approved !== false);

  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
            {content.testimonials.subheading || "Verified Reviews"}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
            {content.testimonials.heading || "What our clients say"}
          </h1>
          <p className="mt-5 text-[15px] leading-7 text-zinc-500 max-w-2xl mx-auto">
            Real feedback from businesses worldwide. Every review is verified and approved by TMG admin before publishing.
          </p>
        </div>

        {approved.length === 0 ? (
          <div className="mt-16 mx-auto max-w-2xl rounded-[24px] border border-dashed border-zinc-300 bg-white p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mx-auto h-12 w-12 rounded-full bg-zinc-900 text-white grid place-items-center font-bold text-xl">★</div>
            <h3 className="mt-6 font-semibold text-lg">No reviews published yet</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              This page is 100% admin-controlled. Go to Admin → Content → Homepage → Testimonials section.<br/>
              Click <b>+ Add</b>, fill client name, company, quote, rating, check <b>Approved</b>, then Save.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/admin/content/homepage" className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-black">
                Go to Admin Editor
              </Link>
              <Link href="/" className="rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-bold">
                Back Home
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {approved.map((t) => (
                <article key={t.id} className="flex flex-col rounded-[24px] border border-zinc-200 bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <div className="flex gap-1 text-[#D4AF37] text-[18px]">{"★".repeat(t.rating || 5)}</div>
                  <p className="mt-4 text-[14px] leading-7 text-zinc-700">"{t.quote}"</p>
                  <div className="mt-auto pt-6 flex items-center gap-3 border-t border-zinc-100">
                    <div className="h-10 w-10 rounded-full bg-zinc-900 text-white grid place-items-center font-bold">{t.clientName.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="text-[13px] font-semibold text-zinc-900">{t.clientName}</p>
                      <p className="text-[11px] text-zinc-500">{t.company}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-12 text-center">
              <p className="text-xs text-zinc-400">{approved.length} verified reviews</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

