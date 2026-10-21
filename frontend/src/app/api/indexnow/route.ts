import { NextRequest, NextResponse } from "next/server";
import { submitToIndexNow } from "@/lib/indexnow";

export async function POST(req: NextRequest) {
    const { urls } = await req.json();
    const ok = await submitToIndexNow(urls);
    return NextResponse.json({ ok, count: urls.length });
}