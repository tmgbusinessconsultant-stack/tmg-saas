import { articles } from "@/app/blog/blog-content";

type SearchDocument = {
  title: string;
  description: string;
  category: string;
  href: string;
  keywords: string[];
  searchableText?: string;
};

const publicDocuments: SearchDocument[] = [
  {
    title: "Business Analysis",
    description: "Assess business performance, identify operational challenges, and turn findings into practical recommendations.",
    category: "Services",
    href: "/services/business-analysis",
    keywords: ["business analysis", "strategy", "operations", "growth", "consulting"],
  },
  {
    title: "Business Automation",
    description: "Identify repetitive work and design practical automation workflows for your team.",
    category: "Services",
    href: "/services",
    keywords: ["automation", "workflow", "AI", "process", "efficiency"],
  },
  {
    title: "Data Analysis and Power BI",
    description: "Use business data, dashboards, and reporting to support clearer decisions.",
    category: "Services",
    href: "/services",
    keywords: ["data analysis", "Power BI", "Excel", "dashboard", "analytics", "report"],
  },
  {
    title: "AI Consulting",
    description: "Explore responsible AI use, practical tools, and automation opportunities for your business.",
    category: "Services",
    href: "/services",
    keywords: ["AI", "artificial intelligence", "consulting", "automation", "tools"],
  },
  {
    title: "Training Programs",
    description: "Explore productivity, leadership, AI, and business training for teams.",
    category: "Training",
    href: "/training",
    keywords: ["training", "workshop", "leadership", "productivity", "team"],
  },
  {
    title: "Website Consulting",
    description: "Review your website strategy, messaging, and opportunities to improve lead generation.",
    category: "Services",
    href: "/services",
    keywords: ["website", "SEO", "conversion", "marketing", "digital"],
  },
  {
    title: "Company Formation Guidance",
    description: "Get guidance on company formation planning and business setup steps in Qatar.",
    category: "Services",
    href: "/services",
    keywords: ["company formation", "Qatar", "business setup", "startup"],
  },
  {
    title: "Business Analysis Case Study",
    description: "See how a structured business review can clarify operational priorities and practical next steps.",
    category: "Case Studies",
    href: "/case-studies",
    keywords: ["case study", "business analysis", "operations", "strategy"],
  },
  {
    title: "Business Analysis Training",
    description: "Training programs for teams developing business, leadership, AI, and productivity skills.",
    category: "Training",
    href: "/training",
    keywords: ["training", "course", "business analysis", "leadership", "AI"],
  },
  {
    title: "Public Business Resources",
    description: "Explore TMG business resources and professional document services.",
    category: "Resources",
    href: "/documents",
    keywords: ["resource", "download", "document", "business guide"],
  },
  {
    title: "Document Review",
    description: "Get professional support reviewing business documents, proposals, and reports.",
    category: "Document Services",
    href: "/documents",
    keywords: ["document", "review", "proposal", "report", "PDF"],
  },
  {
    title: "Request a tailored quote",
    description: "Tell TMG about your goals, requirements, and expected timeline.",
    category: "Get Started",
    href: "/quote",
    keywords: ["price", "cost", "quote", "quotation", "budget"],
  },
  {
    title: "Upload a file to a project",
    description: "Sign in to your client portal to securely upload files to a project.",
    category: "Client Portal",
    href: "/upload",
    keywords: ["upload", "file", "document", "spreadsheet", "project"],
  },
  {
    title: "Ask TMG AI",
    description: "Ask general questions about TMG services and business topics.",
    category: "AI",
    href: "/ai",
    keywords: ["AI", "question", "assistant", "business help"],
  },
  {
    title: "Business FAQs",
    description: "Start with your business goal, describe the challenge, and TMG can recommend a useful next step.",
    category: "FAQ",
    href: "/contact",
    keywords: ["FAQ", "how to start", "consultation", "help", "next steps"],
  },
];

function tokenize(value: string): Set<string> {
  return new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

function score(document: SearchDocument, terms: string[]): number {
  const title = tokenize(document.title);
  const description = tokenize(document.description);
  const category = tokenize(document.category);
  const keywords = tokenize(document.keywords.join(" "));
  const searchableText = tokenize(document.searchableText ?? "");
  const categoryWeight = document.category === "Services" ? 3
    : document.category === "Case Studies" ? 2
      : document.category === "Training" ? 1
        : document.category.startsWith("Blog") ? 0
          : 0;
  return terms.reduce((total, term) => {
    if (title.has(term)) return total + 6;
    if (keywords.has(term)) return total + 4;
    if (category.has(term)) return total + 2 + categoryWeight;
    if (description.has(term)) return total + 1;
    if (searchableText.has(term)) return total + 1;
    return total;
  }, 0);
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 120) {
    return Response.json({ results: [] });
  }
  const terms = [...tokenize(query)];
  const documents = [...publicDocuments];

  for (const article of articles) {
    documents.push({
      title: article.title,
      description: article.summary,
      category: `Blog · ${article.category}`,
      href: `/blog/${encodeURIComponent(article.slug)}`,
      keywords: [article.category, ...article.takeaways],
      searchableText: article.sections
        .flatMap((section) => [section.heading, ...section.paragraphs, ...(section.bullets ?? [])])
        .join(" "),
    });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (apiUrl) {
    const routes = ["/blog", "/gallery", "/content/homepage"];
    const fetched = await Promise.allSettled(routes.map(async (route) => {
      const response = await fetch(`${apiUrl}${route}`, { cache: "no-store", signal: AbortSignal.timeout(1200) });
      if (!response.ok) throw new Error(`${route} returned ${response.status}`);
      return { route, body: await response.json() as unknown };
    }));
    for (const result of fetched) {
      if (result.status === "rejected") {
        console.error("Search could not load some public CMS content.", result.reason);
        continue;
      }
      const { route, body } = result.value;
      if (route === "/blog" && Array.isArray(body)) {
        for (const value of body) {
          if (typeof value !== "object" || value === null) continue;
          const post = value as {
            title?: unknown; slug?: unknown; excerpt?: unknown; content?: unknown;
            category?: { name?: unknown }; tags?: unknown;
          };
          if (typeof post.title !== "string" || typeof post.slug !== "string" || typeof post.excerpt !== "string") continue;
          const href = `/blog/${encodeURIComponent(post.slug)}`;
          if (documents.some((document) => document.href === href)) continue;
          documents.push({
            title: post.title,
            description: post.excerpt,
            category: `Blog · ${typeof post.category?.name === "string" ? post.category.name : "Insights"}`,
            href,
            keywords: Array.isArray(post.tags) ? post.tags.filter((tag): tag is string => typeof tag === "string") : [],
            searchableText: typeof post.content === "string" ? post.content.replace(/<[^>]*>/g, " ").slice(0, 20000) : "",
          });
        }
      } else if (route === "/gallery" && Array.isArray(body)) {
        for (const value of body) {
          if (typeof value !== "object" || value === null) continue;
          const item = value as { id?: unknown; title?: unknown; description?: unknown; category?: unknown };
          if (typeof item.id !== "string" || typeof item.title !== "string" || typeof item.description !== "string") continue;
          documents.push({
            title: item.title,
            description: item.description,
            category: `Gallery · ${typeof item.category === "string" ? item.category : "Work"}`,
            href: "/gallery",
            keywords: ["gallery", "portfolio", typeof item.category === "string" ? item.category : "work"],
          });
        }
      } else if (route === "/content/homepage" && typeof body === "object" && body !== null) {
        const page = body as { caseStudies?: unknown; faq?: unknown };
        if (Array.isArray(page.caseStudies)) {
          for (const item of page.caseStudies) {
            if (typeof item !== "object" || item === null) continue;
            const study = item as { title?: unknown; description?: unknown };
            if (typeof study.title !== "string" || typeof study.description !== "string") continue;
            documents.push({ title: study.title, description: study.description, category: "Case Studies", href: "/case-studies", keywords: ["case study", "results", "client"] });
          }
        }
        if (Array.isArray(page.faq)) {
          for (const item of page.faq) {
            if (typeof item !== "object" || item === null) continue;
            const faq = item as { question?: unknown; answer?: unknown };
            if (typeof faq.question !== "string" || typeof faq.answer !== "string") continue;
            documents.push({ title: faq.question, description: faq.answer, category: "FAQ", href: "/#faq", keywords: ["FAQ", "help", "question"] });
          }
        }
      }
    }
  }

  const results = documents
    .map((document) => ({ document, relevance: score(document, terms) }))
    .filter(({ relevance }) => relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || a.document.title.localeCompare(b.document.title))
    .slice(0, 30)
    .map(({ document }) => ({
      title: document.title,
      description: document.description,
      category: document.category,
      href: document.href,
      keywords: document.keywords.slice(0, 8),
    }));
  return Response.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
