import { NextResponse } from "next/server";
export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    if (!apiUrl) return NextResponse.json({ suggestions: [] });
    const r = await fetch(`${apiUrl}/ai/search-suggestions`, { cache: "no-store" });
    if (!r.ok) return NextResponse.json({ suggestions: [] });
    const data = await r.json().catch(() => ({ suggestions: [] })) as { suggestions?: unknown };
    const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
    return NextResponse.json({ suggestions: suggestions.filter((s: unknown): s is string => typeof s === "string").slice(0, 5) });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
