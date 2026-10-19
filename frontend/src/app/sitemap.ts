import type { MetadataRoute } from "next";
import { articles } from "./blog/blog-content";

type CmsSitemapPost = { slug: string; updatedAt: string; publishDate: string | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://tmgbusinessconsultant.com";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  let cmsPosts: CmsSitemapPost[] = [];
  if (apiUrl) {
    const response = await fetch(`${apiUrl}/blog`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load published posts for sitemap (${response.status}).`);
    cmsPosts = await response.json() as CmsSitemapPost[];
  }
  const cmsSlugs = new Set(cmsPosts.map((post) => post.slug));

  const staticPaths = [
    "",
    "/about",
    "/services",
    "/services/business-analysis",
    "/search",
    "/ai",
    "/upload",
    "/quote",
    "/ai-tools",
    "/pricing",
    "/blog",
    "/gallery",
    "/portfolio",
    "/projects",
    "/case-studies",
    "/contact",
    "/booking",
    "/privacy",
    "/terms",
  ];

  return [
    ...staticPaths.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...cmsPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...articles.filter((article) => !cmsSlugs.has(article.slug)).map((article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: new Date(`${article.date}T09:00:00+03:00`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
