import { apiRequest } from "@/lib/project-delivery";

export type CmsMedia = {
  id: string;
  originalName: string;
  contentType: string;
  size: string;
  status: "SCANNING" | "AVAILABLE" | "REJECTED" | "UNSCANNED";
  scanStatus: "PENDING" | "PASSED" | "FAILED" | "NOT_SCANNED";
  url: string;
  previewUrl: string;
  locations: string[];
  usages: CmsMediaUsage[];
  createdAt: string;
};

export type CmsMediaUsage = {
  entityType: string;
  entityId: string;
  label: string;
  href: string;
  published: boolean;
};

export type CmsCategory = { id: string; name: string; slug: string };

export type CmsPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  galleryImages: string[];
  author: string;
  categoryId: string;
  category: CmsCategory;
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  publishDate: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  openGraphImage: string | null;
  canonicalUrl: string | null;
  schemaMarkup: unknown;
};

export type CmsGalleryItem = {
  id: string;
  mediaId: string;
  title: string;
  description: string;
  category: string;
  displayOrder: number;
  isVisible: boolean;
  media: { originalName: string; contentType: string; status: string };
};

function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!base) {
    if (typeof window !== "undefined") return "";
    throw new Error("NEXT_PUBLIC_API_URL not configured");
  }
  return base;
}

export function contentApiUrl(path: string): string {
  const base = getApiBase();
  if (!base) return path; // client-side safe fallback
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function mediaUrl(path: string): string {
  if (!path) return "";
  return /^https?:\/\//i.test(path) ? path : contentApiUrl(path);
}

export function isExternalMedia(path: string): boolean {
  return /^https?:\/\//i.test(path);
}

export { apiRequest };