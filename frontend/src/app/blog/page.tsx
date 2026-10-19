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
  const response = await fetch(`${base}/blog`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load blog posts (${response.status}).`);
  return response.json() as Promise<PublishedPost[]>;
}

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">TMG Insights</p>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">Ideas for building a stronger business</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Practical guidance on sustainable growth, useful AI, productive teams, and confident leadership.
        </p>
      </div>
      <Suspense fallback={<p className="mt-12 text-center text-slate-500" role="status">Loading articles...</p>}>
        <BlogPosts />
      </Suspense>
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
    <div className="mt-12 grid gap-8 md:grid-cols-2">
        {displayedPosts.map((article) => (
          <article key={article.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
            <Link href={`/blog/${article.slug}`} className="block" aria-label={`Read ${article.title}`}>
              {article.image ? article.image.startsWith("/") && !article.image.startsWith("/content/") ? (
                <Image src={article.image} alt={article.imageAlt} width={1200} height={630} className="aspect-[16/8] w-full object-cover" />
              ) : (
                // CMS media is served by the separate API host.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.image.startsWith("/") ? contentApiUrl(article.image) : article.image} alt={article.imageAlt} className="aspect-[16/8] w-full object-cover" />
              ) : <div className="aspect-[16/8] bg-slate-100" role="img" aria-label="No featured image" />}
            </Link>
            <div className="p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A6A00]">{article.category}</p>
              <h2 className="mt-3 text-2xl font-bold leading-snug">
                <Link href={`/blog/${article.slug}`} className="hover:text-[#8A6A00]">
                  {article.title}
                </Link>
              </h2>
              <p className="mt-4 leading-7 text-slate-600">{article.summary}</p>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <time dateTime={article.date}>{new Date(article.date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}</time>
                <span>{article.author}</span>
              </div>
              <Link
                href={`/blog/${article.slug}`}
                className="mt-6 inline-flex rounded-md bg-[#0F172A] px-5 py-3 font-semibold text-white transition hover:bg-[#1E293B]"
              >
                Read Article <span aria-hidden="true" className="ml-2">→</span>
              </Link>
            </div>
          </article>
        ))}
    </div>
  );
}
