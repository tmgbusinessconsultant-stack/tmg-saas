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
      setMessage("Article link copied.");
    } catch {
      setMessage("Copy this page URL from your browser to share the article.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={shareArticle}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-[#0F172A] hover:bg-slate-100"
      >
        Share article
      </button>
      <button
        type="button"
        onClick={shareOnLinkedIn}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-[#0F172A] hover:bg-slate-100"
      >
        LinkedIn
      </button>
      {message && <span role="status" className="text-sm text-slate-600">{message}</span>}
    </div>
  );
}
