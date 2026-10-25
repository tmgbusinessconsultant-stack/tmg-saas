"use client";

import { useEffect, useState } from "react";
import { contentApiUrl } from "@/lib/content-management";

type Props = {
  url: string;
  token: string;
  contentType: string;
  alt: string;
  className?: string;
};

export default function AdminMediaPreview({ url, token, contentType, alt, className }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const isExternal = /^https?:\/\//i.test(url);

  useEffect(() => {
    if (isExternal || !token || !url) return;

    setLoading(true);
    setError(false);
    let blobUrl: string | undefined;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(contentApiUrl(url), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Preview ${res.status}`);
        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
        setObjectUrl(blobUrl);
      } catch (e) {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      controller.abort();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [token, url, isExternal]);

  if (isExternal) {
    if (contentType.startsWith("image/")) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={url} alt={alt} className={className} />;
    }
    if (contentType.startsWith("video/")) {
      return <video controls src={url} className={className} />;
    }
    return <a href={url} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold hover:border-zinc-900">Preview document</a>;
  }

  if (error) {
    return <span className="inline-flex rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">Preview unavailable</span>;
  }

  if (loading || !objectUrl) {
    return <span className="inline-flex h-10 w-full animate-pulse rounded-[12px] bg-zinc-100" role="status" aria-label="Loading preview" />;
  }

  if (contentType.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={objectUrl} alt={alt} className={className} />;
  }
  if (contentType.startsWith("video/")) {
    return <video controls src={objectUrl} className={className} />;
  }
  return <a href={objectUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold hover:border-zinc-900">Preview document</a>;
}
