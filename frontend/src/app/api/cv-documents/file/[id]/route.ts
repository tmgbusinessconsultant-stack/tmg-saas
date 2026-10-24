import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const searchParams = req.nextUrl.searchParams;
  const isDownload = searchParams.get("download");
  const clientAuth = req.headers.get("authorization");
  let forwardHeaders: any = {};
  if (clientAuth) {
    forwardHeaders["Authorization"] = clientAuth;
  }
  const backendUrl = `http://localhost:4000/api/cv-documents/file/${id}${isDownload ? `?download=${isDownload}` : ""}`;
  console.log(`[PDF Proxy] -> ${backendUrl} auth:${forwardHeaders["Authorization"] ? "YES" : "NO"}`);
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}