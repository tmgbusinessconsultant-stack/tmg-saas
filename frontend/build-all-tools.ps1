$ErrorActionPreference = "Stop"
$appRoot = Join-Path $PSScriptRoot "src/app"

if (-not (Test-Path $appRoot)) {
  $appRoot = Join-Path $PSScriptRoot "app"
}

function New-AI-Api([string]$name, [string]$sysPrompt) {
  $dir = Join-Path $appRoot "api/ai/$name"
  $routePath = Join-Path $dir "route.ts"
  
  if (Test-Path $routePath) {
    Write-Host "Keeping existing configuration framework path: $name"
    return
  }
  
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $safePrompt = $sysPrompt.Replace("'", "''").Replace("`", "\`")
  
  $route = @"
import { NextRequest, NextResponse } from "next/server";
import { requireAuthAndPlan } from "@/lib/auth-guard";

const SYSTEM_PROMPT = `__SYSTEM_PROMPT__
You are international-first. Adapt dynamically to the target market: US, UK, EU, Qatar, or GCC. Only prioritize GCC specific provisions if explicitly requested by the context or active location metadata state parameters.`;

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAuthAndPlan(req, "business-assistant");
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const input = (typeof body?.message === 'string' ? body.message : body?.input || '').trim();
    
    if (!input || input.length < 10) {
      return NextResponse.json({ message: 'Input parameter minimum execution constraint requires 10 characters.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ message: 'Downstream LLM Core Infrastructure Key mismatch.' }, { status: 500 });

    const groqRes = await fetch('https://groq.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${apiKey}\` },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: input },
        ],
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.5,
        max_tokens: 4000,
      }),
    });

    const result = await groqRes.json();
    if (!groqRes.ok) {
      return NextResponse.json({ message: 'Downstream AI engine compilation exception.', details: result?.error?.message }, { status: groqRes.status });
    }

    const outputText = result.choices?.[0]?.message?.content?.trim();
    if (!outputText) return NextResponse.json({ message: 'Null response buffer emitted from LLM loop.' }, { status: 502 });

    return NextResponse.json({ message: outputText });
  } catch (e) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Internal pipeline server compilation fault.' }, { status: 500 });
  }
}
"@
  $route = $route.Replace("__SYSTEM_PROMPT__", $safePrompt)
  Set-Content -Path $routePath -Value $route -Encoding utf8
  Write-Host "Successfully generated API Route Handler: $name"
}

# Execution Pipeline Initialization Matrix Lookups
New-AI-Api "document-review" "You are TMG Document Review AI. Check grammar, clarity, formatting, and compliance parameters for target international structures."
New-AI-Api "cv-builder" "You are TMG CV Builder AI. Generate metric-driven ATS high-performance CV text templates natively in clean Markdown format fields."
New-AI-Api "cover-letter" "You are TMG Cover Letter AI. Craft explicit achievement-focused application abstracts tuned to corporate market structures safely."
New-AI-Api "business-plan" "You are TMG Business Plan AI. Generate bank-ready investment prospectus parameters complete with multi-year operations summaries."
New-AI-Api "sop-builder" "You are TMG SOP Builder AI. Structure operational frameworks mapping out process boundaries, target KPIs, and control checklists."
New-AI-Api "policy-generator" "You are TMG Policy Generator AI. Author clean compliance policies incorporating jurisdiction legal guardrails contextually."
New-AI-Api "risk-assessment" "You are TMG Risk AI. Enumerate and score strategic liabilities, balance factors, and mitigations in tabular models."

Write-Host "All premium microservice route configurations successfully integrated."
