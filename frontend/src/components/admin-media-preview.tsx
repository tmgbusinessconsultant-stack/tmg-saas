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
  const [result, setResult] = useState<{ source: string; url?: string; error: boolean } | null>(null);

  useEffect(() => {
    if (/^https?:\/\//i.test(url) || !token) return;

    let objectUrl: string | undefined;
    const controller = new AbortController();
    void fetch(contentApiUrl(url), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error(`Could not load media preview (${response.status}).`);
      objectUrl = URL.createObjectURL(await response.blob());
      setResult({ source: url, url: objectUrl, error: false });
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) {
        setResult({ source: url, error: true });
        console.error(cause);
      }
    });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token, url]);

  const isExternalUrl = /^https?:\/\//i.test(url);
  const previewUrl = isExternalUrl ? url : result?.source === url ? result.url : null;
  if (!isExternalUrl && result?.source === url && result.error) {
    return <span role="status">Preview unavailable</span>;
  }
  if (!previewUrl) return <span role="status">Loading preview…</span>;
  if (contentType.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={previewUrl} alt={alt} className={className} />;
  }
  if (contentType.startsWith("video/")) {
    return <video controls src={previewUrl} className={className} />;
  }
  return <a href={previewUrl} target="_blank" rel="noreferrer" className="font-semibold underline">Preview document</a>;
}
