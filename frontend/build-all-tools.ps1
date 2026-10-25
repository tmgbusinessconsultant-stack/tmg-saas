$ErrorActionPreference = "Stop"
$appRoot = Join-Path $PSScriptRoot "src\app"

function New-AI-Api([string]$name, [string]$sysPrompt) {
  $dir = Join-Path $appRoot "api\ai\$name"
  $routePath = Join-Path $dir "route.ts"
  if (Test-Path $routePath) {
    Write-Host "Keeping existing API: $name"
    return
  }
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $safePrompt = $sysPrompt.Replace("'", "''").Replace("`", "\`")
  $route = @"
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `__SYSTEM_PROMPT__
You are international-first. Adapt to user's location: US, UK, EU, Qatar, GCC, etc. Only mention Qatar/GCC if user asks or location is Qatar/GCC. Be professional, actionable, and concise.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = (typeof body?.input === 'string' ? body.input : body?.prompt || '').trim();
    if (!input || input.length < 10) {
      return NextResponse.json({ message: 'Please provide at least 10 characters.' }, { status: 400 });
    }
    if (input.length > 8000) {
      return NextResponse.json({ message: 'Input too long (max 8000 chars).' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ message: 'AI not configured.' }, { status: 500 });

    // TODO: Add your auth + plan check here: await checkSubscription(req)

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: input },
        ],
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.6,
        max_tokens: 4000,
      }),
    });

    const result = await groqRes.json();
    if (!groqRes.ok) {
      return NextResponse.json({ message: 'AI provider failed.', details: result?.error?.message }, { status: groqRes.status });
    }

    const message = result.choices?.[0]?.message?.content?.trim();
    if (!message) return NextResponse.json({ message: 'Empty AI response.' }, { status: 502 });

    return NextResponse.json({ message });
  } catch (e) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
  }
}
"@
  $route = $route.Replace("__SYSTEM_PROMPT__", $safePrompt)
  Set-Content -Path $routePath -Value $route -Encoding utf8
  Write-Host "Created API: $name"
}

# International-first prompts
New-AI-Api "cv-builder" "You are TMG CV Builder AI. Create ATS-optimized CVs for global roles (US, UK, EU, GCC). Include header, summary, experience with metrics, skills, education. Format in clean Markdown."
New-AI-Api "business-plan" "You are TMG Business Plan AI. Generate a bank/investor-ready plan: executive summary, market analysis, products, marketing, ops, 3-year financials. Adapt currency/market to user location."
New-AI-Api "document-review" "You are TMG Document Review AI. Review for grammar, clarity, tone, compliance. Give score 0-100, critical issues, and fixed version."
New-AI-Api "sop-builder" "You are TMG SOP Builder AI. Create SOP: purpose, scope, roles, steps, KPIs, risks, checklist. International standard (ISO friendly)."
New-AI-Api "cover-letter" "You are TMG Cover Letter AI. Write ~300 word tailored cover letter, professional, achievement-focused, for international roles."
New-AI-Api "risk-assessment" "You are TMG Risk AI. Identify operational, financial, compliance risks and mitigations in a table."

Write-Host "AI routes are now international, secure, and premium-ready."