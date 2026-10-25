"use client";

import { useState } from "react";

export default function ArticleShare({ title }: { title: string }) {
  const [message, setMessage] = useState("");

  function shareOnLinkedIn() {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  async function shareArticle() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          setMessage("Could not open the share menu.");
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied.");
    } catch {
      setMessage("Copy URL from your browser to share.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={shareArticle}
        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
        Share
      </button>
      <button
        type="button"
        onClick={shareOnLinkedIn}
        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:border-zinc-900 transition-colors"
      >
        LinkedIn
      </button>
      {message && (
        <span role="status" className="rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600">
          {message}
        </span>
      )}
    </div>
  );
}
