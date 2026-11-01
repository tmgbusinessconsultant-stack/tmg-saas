"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type BlogPost = { title: string; content: string };

function isBlogPost(value: unknown): value is BlogPost {
  return typeof value === "object" && value !== null &&
    "title" in value && typeof value.title === "string" &&
    "content" in value && typeof value.content === "string";
}

function sanitizeRichHtml(html: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");
  const allowedTags = new Set([
    "A", "B", "BLOCKQUOTE", "BR", "CODE", "DIV", "EM", "H1", "H2", "H3",
    "H4", "HR", "I", "LI", "OL", "P", "PRE", "SPAN", "STRONG", "U", "UL",
  ]);
  const removeWithContent = new Set(["IFRAME", "OBJECT", "SCRIPT", "STYLE", "SVG", "TEMPLATE"]);

  for (const element of [...document.body.querySelectorAll("*")]) {
    if (removeWithContent.has(element.tagName)) {
      element.remove();
      continue;
    }
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      continue;
    }

    const href = element.tagName === "A" ? element.getAttribute("href") : null;
    for (const attribute of [...element.attributes]) element.removeAttribute(attribute.name);
    if (href) {
      try {
        const url = new URL(href, window.location.origin);
        if (["http:", "https:", "mailto:"].includes(url.protocol)) {
          element.setAttribute("href", url.href);
          element.setAttribute("rel", "noopener noreferrer");
        }
      } catch {
        // Invalid links are removed while retaining their text.
      }
    }
  }
  return document.body.innerHTML;
}

export default function BlogSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      try {
        const url = `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "")}/api/blog/${encodeURIComponent(slug)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Could not load this blog post.");
        const body: unknown = await response.json();
        const data = typeof body === "object" && body !== null && "data" in body ? body.data : body;
        if (!isBlogPost(data)) throw new Error("The blog post response was invalid.");
        const safePost = { ...data, content: sanitizeRichHtml(data.content) };
        if (active) setPost(safePost);
      } catch (loadError: unknown) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load this blog post.");
      }
    });
    return () => { active = false; };
  }, [slug]);

  if (error) return <div className="p-10" role="alert">{error}</div>;
  if (!post) return <div className="p-10">Loading...</div>;
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/blog" className="text-sm">← Blog</Link>
      <h1 className="text-3xl font-bold mt-2">{post.title}</h1>
      <div className="mt-6" dangerouslySetInnerHTML={{ __html: post.content || "No content" }} />
    </div>
  );
}