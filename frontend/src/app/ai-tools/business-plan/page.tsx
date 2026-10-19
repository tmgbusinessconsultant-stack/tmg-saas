'use client';

import { useState } from 'react';
import AiDataNotice from '../ai-data-notice';

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
              {loading ? 'Generating planâ€¦' : 'Generate Plan'}
            </button>
            <AiDataNotice />
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          </div>
        </section>
        <section aria-live="polite" className="border rounded-xl p-5 bg-white whitespace-pre-wrap text-sm min-h-[480px] max-h-[680px] overflow-auto">
          {loading ? 'Generating your business planâ€¦' : output || 'Your generated business plan will appear here.'}
        </section>
      </div>
    </div>
  );
}
