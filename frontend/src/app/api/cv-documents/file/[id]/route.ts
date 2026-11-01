import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const searchParams = req.nextUrl.searchParams;
  const isDownload = searchParams.get("download");
  const clientAuth = req.headers.get("authorization");
  const forwardHeaders = new Headers();
  if (clientAuth) {
    forwardHeaders.set("Authorization", clientAuth);
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "http://localhost:4000/api";
  const downloadQuery = isDownload ? `?${new URLSearchParams({ download: isDownload })}` : "";
  const backendUrl = `${apiBase}/cv-documents/file/${encodeURIComponent(id)}${downloadQuery}`;
  console.log(`[PDF Proxy] -> ${backendUrl} auth:${forwardHeaders.has("Authorization") ? "YES" : "NO"}`);
  try {
    const res = await fetch(backendUrl, { headers: forwardHeaders, cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Backend error ${res.status} ${text}`);
      return NextResponse.json({ error: text }, { status: res.status });
    }
    const blob = await res.arrayBuffer();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": res.headers.get("Content-Disposition") || "inline",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "The document service is unavailable.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}