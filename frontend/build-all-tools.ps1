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
  $route = @'
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = typeof body?.input === 'string'
      ? body.input.trim()
      : typeof body?.prompt === 'string'
        ? body.prompt.trim()
        : '';

    if (!input) {
      return Response.json({ message: 'Please provide input to generate a result.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ message: 'Missing GROQ_API_KEY environment variable' }, { status: 500 });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: '__SYSTEM_PROMPT__ Respond in a professional, actionable Qatar/GCC business context where relevant.' },
          { role: 'user', content: input.slice(0, 4000) },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
      }),
    });

    const result = await groqRes.json();
    if (!groqRes.ok) {
      return Response.json(
        { message: 'AI provider request failed.', details: result },
        { status: groqRes.status },
      );
    }

    const message = result.choices?.[0]?.message?.content;
    if (typeof message !== 'string' || !message.trim()) {
      return Response.json({ message: 'The AI provider returned an empty response.' }, { status: 502 });
    }

    return Response.json({ message });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return Response.json({ message: `Error generating result: ${message}` }, { status: 500 });
  }
}
'@
  $route = $route.Replace("__SYSTEM_PROMPT__", $sysPrompt)
  Set-Content -Path $routePath -Value $route -Encoding utf8
  Write-Host "Created API: $name"
}

New-AI-Api "cv-builder" "You are TMG CV Builder AI. Create ATS-optimized CVs for Qatar, GCC, and UK roles. Include a header, professional summary, experience with measurable achievements, skills, and education."
New-AI-Api "business-plan" "You are TMG Business Plan AI. Generate a bank-ready business plan with an executive summary, market analysis, products, marketing, operations, and three-year financial assumptions for Qatar."
New-AI-Api "document-review" "You are TMG Document Review AI. Review the provided document for grammar, professional tone, and Qatar compliance considerations. Give a score from 0 to 100 and concrete fixes."
New-AI-Api "sop-builder" "You are TMG SOP Builder AI. Create a detailed SOP with purpose, scope, roles, numbered steps, KPIs, and a checklist."
New-AI-Api "cover-letter" "You are TMG Cover Letter AI. Write a tailored, professional cover letter for GCC jobs in approximately 300 words."

$cvPagePath = Join-Path $appRoot "ai-tools\cv-builder\page.tsx"
New-Item -ItemType Directory -Force -Path (Split-Path $cvPagePath) | Out-Null
$cvPage = @'
'use client';

import { useState } from 'react';

export default function CVBuilderPage() {
  const [form, setForm] = useState({ name: '', role: '', experience: '' });
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    const input = `Name: ${form.name}\nTarget role: ${form.role}\nExperience: ${form.experience}`.trim();
    if (!form.name.trim() || !form.role.trim() || !form.experience.trim()) {
      setError('Complete all fields before generating your CV.');
      return;
    }

    setLoading(true);
    setError('');
    setOutput('');
    try {
      const response = await fetch('/api/ai/cv-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not generate your CV.');
      setOutput(result.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not generate your CV.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">AI tool</p>
          <h1 className="mt-2 text-3xl font-bold">CV Builder AI</h1>
          <p className="mt-3 text-slate-600">Create a structured, ATS-friendly CV tailored to your target role.</p>
          <div className="mt-6 space-y-3">
            <label className="block text-sm font-medium">
              Full name
              <input className="mt-1 w-full border border-slate-300 p-3 rounded" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="block text-sm font-medium">
              Target role
              <input className="mt-1 w-full border border-slate-300 p-3 rounded" placeholder="e.g. Business Analyst" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
            </label>
            <label className="block text-sm font-medium">
              Experience, skills, and education
              <textarea className="mt-1 w-full border border-slate-300 p-3 rounded h-36" value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} />
            </label>
            <button type="button" onClick={generate} disabled={loading} className="w-full bg-[#0F172A] text-white py-3 rounded font-bold disabled:opacity-60">
              {loading ? 'Generating CV…' : 'Generate CV'}
            </button>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          </div>
        </section>
        <section aria-live="polite" className="border rounded-xl p-5 bg-white whitespace-pre-wrap text-sm min-h-[480px] max-h-[680px] overflow-auto">
          {loading ? 'Generating your CV…' : output || 'Your generated CV will appear here.'}
        </section>
      </div>
    </div>
  );
}
'@
Set-Content -Path $cvPagePath -Value $cvPage -Encoding utf8

$planPagePath = Join-Path $appRoot "ai-tools\business-plan\page.tsx"
New-Item -ItemType Directory -Force -Path (Split-Path $planPagePath) | Out-Null
$planPage = @'
'use client';

import { useState } from 'react';

export default function BusinessPlanPage() {
  const [form, setForm] = useState({ idea: '', budget: '', location: 'Doha' });
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!form.idea.trim() || !form.budget.trim() || !form.location.trim()) {
      setError('Complete all fields before generating your business plan.');
      return;
    }

    const input = `Business idea: ${form.idea}\nBudget: ${form.budget}\nLocation: ${form.location}`;
    setLoading(true);
    setError('');
    setOutput('');
    try {
      const response = await fetch('/api/ai/business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not generate your business plan.');
      setOutput(result.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not generate your business plan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">AI tool</p>
          <h1 className="mt-2 text-3xl font-bold">Business Plan AI</h1>
          <p className="mt-3 text-slate-600">Generate a practical business plan with market, operations, and financial sections.</p>
          <div className="mt-6 space-y-3">
            <label className="block text-sm font-medium">
              Business idea
              <textarea className="mt-1 w-full border border-slate-300 p-3 rounded h-28" value={form.idea} onChange={(event) => setForm({ ...form, idea: event.target.value })} />
            </label>
            <label className="block text-sm font-medium">
              Available budget
              <input className="mt-1 w-full border border-slate-300 p-3 rounded" placeholder="e.g. 100,000 QAR" value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} />
            </label>
            <label className="block text-sm font-medium">
              Location / market
              <input className="mt-1 w-full border border-slate-300 p-3 rounded" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </label>
            <button type="button" onClick={generate} disabled={loading} className="w-full bg-[#D4AF37] text-black py-3 rounded font-bold disabled:opacity-60">
              {loading ? 'Generating plan…' : 'Generate Plan'}
            </button>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          </div>
        </section>
        <section aria-live="polite" className="border rounded-xl p-5 bg-white whitespace-pre-wrap text-sm min-h-[480px] max-h-[680px] overflow-auto">
          {loading ? 'Generating your business plan…' : output || 'Your generated business plan will appear here.'}
        </section>
      </div>
    </div>
  );
}
'@
Set-Content -Path $planPagePath -Value $planPage -Encoding utf8

Write-Host "AI routes and tool pages are ready."
