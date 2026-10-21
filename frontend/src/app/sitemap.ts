import type { MetadataRoute } from "next";
import { articles } from "./blog/blog-content";

type CmsSitemapPost = { slug: string; updatedAt: string; publishDate: string | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://tmgbusinessconsulting.com";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  let cmsPosts: CmsSitemapPost[] = [];

  // SAFE FETCH - Won't crash site if API is down (Your old code threw Error and broke sitemap.xml)
  if (apiUrl) {
    try {
      const response = await fetch(`${apiUrl}/blog`, {
        next: { revalidate: 3600 } // Cache 1 hour - Better for SEO than no-store
      });
      if (response.ok) {
        cmsPosts = (await response.json()) as CmsSitemapPost[];
      }
    } catch (err) {
      console.warn("Sitemap: CMS not reachable, using static articles only", err);
    }
  }

  const cmsSlugs = new Set(cmsPosts.map((post) => post.slug));

  // CONNECTED TO robots.ts - All public pages that allow: "/" 
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

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const cmsRoutes: MetadataRoute.Sitemap = cmsPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const localArticleRoutes: MetadataRoute.Sitemap = articles
    .filter((article) => !cmsSlugs.has(article.slug))
    .map((article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: new Date(`${article.date}T09:00:00+03:00`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  // FINAL CONNECTED SITEMAP
  return [...staticRoutes, ...cmsRoutes, ...localArticleRoutes];
}