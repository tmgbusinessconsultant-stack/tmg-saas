import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { contentApiUrl } from "@/lib/content-management";
import { articles } from "./blog-content";

type PublishedPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  author: string;
  category: { name: string; slug: string };
  publishDate: string | null;
  createdAt: string;
};

async function getCmsPosts(): Promise<PublishedPost[]> {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!base) return [];
  try {
    const response = await fetch(`${base}/blog`, { cache: "no-store" });
    if (!response.ok) return [];
    return (await response.json()) as PublishedPost[];
  } catch {
    return [];
  }
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">TMG Insights • Qatar & GCC</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl leading-[1.1]">Ideas for building a stronger business</h1>
          <p className="mt-5 text-[15px] leading-7 text-zinc-500 max-w-2xl mx-auto">Practical guidance on sustainable growth, useful AI, productive teams, and confident leadership. No fluff.</p>
        </div>
        <Suspense fallback={<p className="mt-16 text-center text-sm text-zinc-400" role="status">Loading articles...</p>}>
          <BlogPosts />
        </Suspense>
      </div>
    </div>
  );
}

async function BlogPosts() {
  const cmsPosts = await getCmsPosts();
  const cmsSlugs = new Set(cmsPosts.map((post) => post.slug));
  const displayedPosts = [
    ...cmsPosts.map((post) => ({
      slug: post.slug,
      title: post.title,
      summary: post.excerpt,
      image: post.featuredImage,
      imageAlt: post.title,
      category: post.category.name,
      date: post.publishDate ?? post.createdAt,
      author: post.author,
    })),
    ...articles.filter((article) => !cmsSlugs.has(article.slug)).map((article) => ({
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      image: article.image,
      imageAlt: article.imageAlt,
      category: article.category,
      date: article.date,
      author: "TMG Business Consulting",
    })),
  ];

  return (
    <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {displayedPosts.map((article) => (
        <article key={article.slug} className="group flex flex-col overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-zinc-900 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all">
          <Link href={`/blog/${article.slug}`} className="block overflow-hidden" aria-label={`Read ${article.title}`}>
            {article.image ? (
              article.image.startsWith("/") && !article.image.startsWith("/content/") ? (
                <Image src={article.image} alt={article.imageAlt} width={1200} height={630} className="aspect-[16/10] w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.image.startsWith("/") ? contentApiUrl(article.image) : article.image} alt={article.imageAlt} className="aspect-[16/10] w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
              )
            ) : (
              <div className="aspect-[16/10] bg-zinc-100 grid place-items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
              </div>
            )}
          </Link>
          <div className="flex flex-1 flex-col p-6 md:p-7">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{article.category}</p>
            </div>
            <h2 className="mt-3 text-[18px] font-semibold leading-snug tracking-tight text-zinc-900">
              <Link href={`/blog/${article.slug}`} className="group-hover:text-zinc-700">{article.title}</Link>
            </h2>
            <p className="mt-3 text-[13px] leading-6 text-zinc-500 line-clamp-3">{article.summary}</p>
            <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-400">
              <time dateTime={article.date}>{new Date(article.date).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}</time>
              <span>•</span>
              <span className="truncate">{article.author}</span>
            </div>
            <div className="mt-6 pt-5 border-t border-zinc-100">
              <Link href={`/blog/${article.slug}`} className="inline-flex rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors">
                Read Article
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
