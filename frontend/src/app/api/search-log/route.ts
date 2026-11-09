import { NextResponse } from "next/server";
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = typeof body.query === "string" ? body.query : "";
    const resultCount = typeof body.resultCount === "number" ? body.resultCount : 0;
    if (query.trim().length < 2) return NextResponse.json({ recorded: false });
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    if (!apiUrl) return NextResponse.json({ recorded: false });
    const r = await fetch(`${apiUrl}/ai/search-analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, resultCount }),
    });
    return NextResponse.json({ recorded: r.ok });
  } catch {
    return NextResponse.json({ recorded: false });
  }
}
