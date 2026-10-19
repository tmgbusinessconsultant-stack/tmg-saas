import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { contentApiUrl } from "@/lib/content-management";
import ArticleShare from "../article-share";
import { articles, getArticle } from "../blog-content";

const siteUrl = "https://tmgbusinessconsulting.com";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

type CmsPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  galleryImages: string[];
  author: string;
  tags: string[];
  category: { name: string };
  publishDate: string | null;
  createdAt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  openGraphImage: string | null;
  canonicalUrl: string | null;
  schemaMarkup: unknown;
};

function sectionId(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function getCmsPost(slug: string): Promise<CmsPost | null> {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!base) return null;
  const response = await fetch(`${base}/blog/${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Could not load blog article (${response.status}).`);
  return response.json() as Promise<CmsPost>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCmsPost(slug);
  if (post) {
    const url = post.canonicalUrl ?? `${siteUrl}/blog/${post.slug}`;
    const image = post.openGraphImage ?? post.featuredImage;
    return {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      keywords: post.seoKeywords.length > 0 ? post.seoKeywords : undefined,
      alternates: { canonical: url },
      openGraph: {
        type: "article",
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.excerpt,
        url,
        siteName: "TMG Business Consulting",
        publishedTime: post.publishDate ?? post.createdAt,
        authors: [post.author],
        ...(image ? { images: [{ url: resolveMediaUrl(image), alt: post.title }] } : {}),
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.excerpt,
        ...(image ? { images: [{ url: resolveMediaUrl(image), alt: post.title }] } : {}),
      },
    };
  }
  const article = getArticle(slug);
  if (!article) return {};

  const url = `${siteUrl}/blog/${article.slug}`;
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url,
      siteName: "TMG Business Consulting",
      publishedTime: new Date(`${article.date}T09:00:00+03:00`).toISOString(),
      authors: ["TMG Business Consulting"],
      images: [{ url: article.image, alt: article.imageAlt, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [{ url: article.image, alt: article.imageAlt }],
    },
  };
}

function resolveMediaUrl(path: string): string {
  return /^https?:\/\//i.test(path) ? path : contentApiUrl(path);
}

export default function BlogArticlePage({ params }: ArticlePageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" aria-label="Loading article" />}>
      <BlogArticleContent params={params} />
    </Suspense>
  );
}

async function BlogArticleContent({ params }: ArticlePageProps) {
  const { slug } = await params;
  const cmsPost = await getCmsPost(slug);
  if (cmsPost) return <CmsBlogArticle post={cmsPost} />;
  const article = getArticle(slug);
  if (!article) notFound();

  const url = `${siteUrl}/blog/${article.slug}`;
  const datePublished = new Date(`${article.date}T09:00:00+03:00`).toISOString();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: article.title,
        description: article.description,
        image: [`${siteUrl}${article.image}`],
        datePublished,
        dateModified: datePublished,
        author: { "@type": "Organization", name: "TMG Business Consulting", url: siteUrl },
        publisher: {
          "@type": "Organization",
          name: "TMG Business Consulting",
          url: siteUrl,
          logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        articleSection: article.category,
        timeRequired: `PT${article.readingTime}M`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
          { "@type": "ListItem", position: 3, name: article.title, item: url },
        ],
      },
    ],
  };
  const relatedArticles = articles.filter((item) => item.slug !== article.slug).slice(0, 3);

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-[#8A6A00]">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/blog" className="hover:text-[#8A6A00]">Blog</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-slate-700">{article.title}</li>
          </ol>
        </nav>

        <header className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A6A00]">{article.category}</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-[#0F172A] sm:text-4xl lg:text-5xl">{article.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{article.summary}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span>By <span className="font-medium text-slate-700">TMG Business Consulting</span></span>
            <span aria-hidden="true">•</span>
            <time dateTime={article.date}>{article.displayDate}</time>
            <span aria-hidden="true">•</span>
            <span>{article.readingTime} min read</span>
          </div>
        </header>

        <figure className="mx-auto mt-8 max-w-6xl overflow-hidden rounded-2xl bg-[#0F172A]">
          <Image
            src={article.image}
            alt={article.imageAlt}
            width={1200}
            height={630}
            priority
            className="aspect-[16/8] w-full object-cover"
          />
        </figure>

        <div className="mx-auto mt-12 grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <article className="min-w-0">
            <div className="space-y-10">
              {article.sections.map((section) => (
                <section key={section.heading} id={sectionId(section.heading)} className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-[#0F172A]">{section.heading}</h2>
                  <div className="mt-4 space-y-4 text-base leading-8 text-slate-700">
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {section.bullets && (
                      <ul className="list-disc space-y-2 pl-6">
                        {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <section id="key-takeaways" className="mt-12 scroll-mt-28 rounded-2xl border border-[#E9D796] bg-[#FFFBEB] p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-[#0F172A]">Key takeaways</h2>
              <ul className="mt-5 space-y-3 text-slate-700">
                {article.takeaways.map((takeaway) => (
                  <li key={takeaway} className="flex gap-3">
                    <span aria-hidden="true" className="font-bold text-[#8A6A00]">✓</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-8">
              <ArticleShare title={article.title} />
            </div>

            <section className="mt-12 rounded-2xl bg-[#0F172A] p-7 text-white sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">Take the next step</p>
              <h2 className="mt-3 text-2xl font-bold">Put these ideas to work in your business</h2>
              <p className="mt-3 leading-7 text-slate-300">{article.cta}</p>
              <Link href="/booking" className="mt-6 inline-flex rounded-md bg-[#D4AF37] px-6 py-3 font-bold text-[#0F172A] hover:bg-white">
                Get Quote
              </Link>
            </section>
          </article>

          <aside className="lg:sticky lg:top-24">
            <nav aria-label="Table of contents" className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="font-bold text-[#0F172A]">In this article</h2>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {article.sections.map((section) => (
                  <li key={section.heading}>
                    <a className="hover:text-[#8A6A00]" href={`#${sectionId(section.heading)}`}>{section.heading}</a>
                  </li>
                ))}
                <li><a className="font-medium hover:text-[#8A6A00]" href="#key-takeaways">Key takeaways</a></li>
              </ol>
            </nav>
          </aside>
        </div>

        <section className="mx-auto mt-16 max-w-6xl border-t border-slate-200 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A6A00]">Keep learning</p>
              <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">Related articles</h2>
            </div>
            <Link href="/blog" className="font-semibold text-[#0F172A] hover:text-[#8A6A00]">All insights →</Link>
          </div>
          <div className="mt-7 grid gap-6 md:grid-cols-3">
            {relatedArticles.map((related) => (
              <article key={related.slug} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <Link href={`/blog/${related.slug}`} aria-label={`Read ${related.title}`}>
                  <Image src={related.image} alt={related.imageAlt} width={1200} height={630} className="aspect-[16/9] w-full object-cover" />
                </Link>
                <div className="p-5">
                  <h3 className="text-lg font-bold leading-snug text-[#0F172A]">
                    <Link href={`/blog/${related.slug}`} className="hover:text-[#8A6A00]">{related.title}</Link>
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{related.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function CmsBlogArticle({ post }: { post: CmsPost }) {
  const published = post.publishDate ?? post.createdAt;
  const canonical = post.canonicalUrl ?? `${siteUrl}/blog/${post.slug}`;
  const schema = post.schemaMarkup ?? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: post.featuredImage ? [resolveMediaUrl(post.featuredImage)] : undefined,
    datePublished: published,
    dateModified: published,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: "TMG Business Consulting", url: siteUrl },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    articleSection: post.category.name,
    keywords: post.seoKeywords.length > 0 ? post.seoKeywords.join(", ") : post.tags,
  };
  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-2"><li><Link href="/">Home</Link></li><li aria-hidden="true">/</li><li><Link href="/blog">Blog</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="text-slate-700">{post.title}</li></ol>
        </nav>
        <header className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A6A00]">{post.category.name}</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-[#0F172A] sm:text-4xl lg:text-5xl">{post.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{post.excerpt}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500"><span>By {post.author}</span><time dateTime={published}>{new Date(published).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}</time></div>
        </header>
        {post.featuredImage && <figure className="mx-auto mt-8 max-w-6xl overflow-hidden rounded-2xl bg-slate-100">
          {/* Public CMS image URL is served through the API media proxy. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolveMediaUrl(post.featuredImage)} alt={post.title} className="aspect-[16/8] w-full object-cover" />
        </figure>}
        <article className="cms-rich-content mx-auto mt-12 max-w-4xl" dangerouslySetInnerHTML={{ __html: post.content }} />
        {post.galleryImages.length > 0 && <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {post.galleryImages.map((image, index) => (
            // Public CMS image URLs are sanitized and served through the API media proxy.
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${image}-${index}`} src={resolveMediaUrl(image)} alt={`${post.title} gallery image ${index + 1}`} className="aspect-[4/3] w-full rounded-xl object-cover" />
          ))}
        </div>}
        <div className="mx-auto mt-10 max-w-4xl"><ArticleShare title={post.title} /></div>
        <section className="mx-auto mt-12 max-w-4xl rounded-2xl bg-[#0F172A] p-7 text-white sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">Take the next step</p>
          <h2 className="mt-3 text-2xl font-bold">Put these ideas to work in your business</h2>
          <p className="mt-3 leading-7 text-slate-300">Contact TMG Business Consulting to discuss your goals.</p>
          <Link href="/booking" className="mt-6 inline-flex rounded-md bg-[#D4AF37] px-6 py-3 font-bold text-[#0F172A] hover:bg-white">Get Quote</Link>
        </section>
      </div>
    </div>
  );
}
