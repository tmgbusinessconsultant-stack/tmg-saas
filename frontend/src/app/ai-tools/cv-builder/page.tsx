'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/project-delivery';
import AiDataNotice from '../ai-data-notice';

type SavedCv = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  previewUrl: string;
  downloadUrl: string;
};

export default function CVBuilderPage() {
  const [form, setForm] = useState({ name: '', role: '', experience: '' });
  const [savedCv, setSavedCv] = useState<SavedCv | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setToken(sessionStorage.getItem('accessToken') ?? '');
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function generate() {
    if (!token) {
      setError('Sign in to generate and save your CV to your private library.');
      return;
    }
    if (!form.name.trim() || !form.role.trim() || !form.experience.trim()) {
      setError('Complete all fields before generating your CV.');
      return;
    }

    setLoading(true);
    setError('');
    setSavedCv(null);
    try {
      const result = await apiRequest<SavedCv>('/cv-documents', token, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSavedCv(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not generate and save your CV.');
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
          <p className="mt-3 text-slate-600">Create an ATS-friendly CV, save it to your account, preview the PDF, and download it later from your library.</p>
          {token ? (
            <Link href="/dashboard/cvs" className="mt-4 inline-block font-semibold text-[#8A6A00] underline">Open my CV library</Link>
          ) : (
            <Link href="/login?next=%2Fai-tools%2Fcv-builder" className="mt-4 inline-block font-semibold text-[#8A6A00] underline">Sign in to save your CV</Link>
          )}
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
              {loading ? 'Generating and saving CV…' : 'Generate, save, and create PDF'}
            </button>
            <AiDataNotice />
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          </div>
        </section>
        <section aria-live="polite" className="border rounded-xl p-5 bg-white text-sm min-h-[480px]">
          {loading ? <p role="status">Generating your CV and creating its private PDF…</p> : savedCv ? (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold">{savedCv.title}</h2>
                  <p className="text-xs text-slate-500">Saved {new Date(savedCv.createdAt).toLocaleString()}</p>
                </div>
                <a href={savedCv.downloadUrl} className="rounded-md bg-[#0F172A] px-4 py-2 font-semibold text-white">Download PDF</a>
              </div>
              <iframe title={`PDF preview: ${savedCv.title}`} src={savedCv.previewUrl} className="h-[600px] w-full rounded border border-slate-200" />
            </div>
          ) : <p className="whitespace-pre-wrap text-slate-600">Your saved CV PDF preview will appear here after generation.</p>}
        </section>
      </div>
    </div>
  );
}
