import { NextRequest, NextResponse } from "next/server";
import { requireAuthAndPlan } from "@/lib/auth-guard";

const SYSTEM_PROMPT = `You are TMG CV Builder AI (International). Create ATS-optimized CVs.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const input = (typeof body?.input === 'string' ? body.input : '').trim().slice(0,8000);
    if (!input || input.length < 10) return NextResponse.json({ message: 'Add more details (min 10 chars).' }, { status: 400 });
    const guard = await requireAuthAndPlan(req, "cv-builder");
    if (!guard.ok) return guard.response;
    if (!process.env.GROQ_API_KEY) return NextResponse.json({ message: 'AI not configured' }, { status: 500 });
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: input }],
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.5,
        max_tokens: 4000,
      }),
    });
    const result = await res.json();
    if (!res.ok) return NextResponse.json({ message: result?.error?.message || 'AI provider error' }, { status: res.status });
    const content = result?.choices?.[0]?.message?.content?.trim();
    if (!content) return NextResponse.json({ message: 'Empty response' }, { status: 502 });
    return NextResponse.json({ message: content });
  } catch { return NextResponse.json({ message: 'Server error' }, { status: 500 }); }
}

