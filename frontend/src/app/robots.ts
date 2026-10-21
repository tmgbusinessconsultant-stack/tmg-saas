import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/api/", "/login"],
      },
      {
        userAgent: ["GPTBot", "ChatGPT-User", "ClaudeBot", "Google-Extended", "PerplexityBot", "CCBot"],
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/api/"],
      },
    ],
    sitemap: "https://tmgbusinessconsulting.com/sitemap.xml",
    host: "https://tmgbusinessconsulting.com",
  };
}