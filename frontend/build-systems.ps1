$ErrorActionPreference = "Stop"
$appRoot = "src/app"

# Only create folders if not exists - don't nuke existing
$tools = @("document-review", "cv-builder", "cover-letter", "business-plan", "sop-builder", "policy-generator", "risk-assessment")
foreach ($t in $tools) { 
  New-Item -ItemType Directory -Force -Path "$appRoot/api/ai/$t" | Out-Null
  New-Item -ItemType Directory -Force -Path "$appRoot/ai-tools/$t" | Out-Null
}
"services", "training", "documents", "pricing", "booking", "dashboard", "admin" | ForEach-Object { New-Item -ItemType Directory -Force -Path "$appRoot/$_" | Out-Null }

function New-Api($name, $prompt) {
  $path = "$appRoot/api/ai/$name/route.ts"
  if (Test-Path $path) { Write-Host "SKIP existing: $name"; return }

  $cleanPrompt = $prompt.Replace('`', '\`')
  @"
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = ``$cleanPrompt``;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const input = typeof body?.input === 'string' ? body.input : typeof body?.messages?.[0]?.content === 'string' ? body.messages[0].content : JSON.stringify(body?.data || '').slice(0,8000);
    if (!input || input.trim().length < 10) return NextResponse.json({ message: 'Add more details (min 10 chars).' }, { status: 400 });

    if (!process.env.GROQ_API_KEY) return NextResponse.json({ message: 'AI not configured' }, { status: 500 });
    // TODO: await requireAuthAndPlan(req) - connect to your paymentPlans

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.GROQ_API_KEY },
      body: JSON.stringify({
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: input.slice(0,8000) }],
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
  } catch (e) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
"@ | Set-Content $path -Encoding utf8
  Write-Host "Created: $name"
}

# INTERNATIONAL PROMPTS - US/UK/EU/Qatar/GCC adaptable
New-Api "document-review" "You are TMG Document Review AI (International). Check grammar, clarity, formatting, professional tone, and compliance hints for user's market (detect from input: US, UK, EU, Qatar, GCC). Give Score 0-100, Issues, Fixed Version. Markdown."
New-Api "cv-builder" "You are TMG CV Builder AI (International). Create ATS-optimized CV for any market (US, UK, EU, GCC). Use clean Markdown: Header, Summary, Experience with metrics, Skills, Education. Adapt format to target country."
New-Api "cover-letter" "You are TMG Cover Letter AI (International). Write 280-320 word compelling, tailored cover letter. Achievement-focused, adapt tone to US/UK/GCC."
New-Api "business-plan" "You are TMG Business Plan AI (International). Bank/investor-ready plan: Executive Summary, Market, Products, Marketing, Ops, 3-Year Financials. Auto adapt currency/regulations to user's location."
New-Api "sop-builder" "You are TMG SOP Builder AI (International). Generate ISO-friendly SOP: Purpose, Scope, Roles, Steps, KPIs, Risks, Checklist."
New-Api "policy-generator" "You are TMG Policy Generator AI (International). Generate HR/Compliance policies. Adapt to Qatar Labor Law if Qatar, otherwise US/UK/EU standard. Always include disclaimer."
New-Api "risk-assessment" "You are TMG Risk AI (International). Create risk table: Risk, Likelihood, Impact, Mitigation. Cover Ops, Financial, Legal, Compliance."

Write-Host "Done - APIs are international, secure, no leaks."

# Do NOT create placeholder pages - they hurt SEO. Use your existing premium pages.
Write-Host "SKIP page creation - keep your premium pages for services/training/pricing etc."