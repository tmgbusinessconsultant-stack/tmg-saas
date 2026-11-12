'use client';;
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Site = {
  id: string;
  name: string;
  status: string;
  subdomain: string;
  userId?: string;
  user?: { email: string };
  pages?: unknown[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSite(value: unknown): value is Site {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.status === 'string'
    && typeof value.subdomain === 'string'
    && (value.userId === undefined || typeof value.userId === 'string')
    && (value.user === undefined || (isRecord(value.user) && typeof value.user.email === 'string'))
    && (value.pages === undefined || Array.isArray(value.pages));
}

export default function AdminSitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/sites/admin/all`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(`Could not load sites (${res.status}).`);
      if (!Array.isArray(data) || !data.every(isSite)) throw new Error('The sites API returned an invalid response.');
      setSites(data);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Could not load sites.');
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => { if (active) void load(); }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [load]);

  const createSite = async () => {
    if(!newName) return;
    await fetch(`${API}/sites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ name: newName, settings: {} })
    });
    setNewName('');
    void load();
  };

  if(loading) return <div className="p-10">Loading all sites...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">TMG Admin — All Client Sites</h1>
      <p className="text-gray-500 mb-6">Best Flow: Admin sees all, Client edits at /builder/[id], Live at /s/[subdomain]</p>
      {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-800">{error}</p>}
      
      <div className="flex gap-2 mb-8">
        <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Client company name e.g. Al Rayyan Trading" className="border p-3 rounded w-96" />
        <button onClick={createSite} className="bg-[#0a2540] text-white px-6 rounded font-bold">+ Create Site</button>
        <button onClick={load} className="border px-4 rounded">Refresh</button>
      </div>

      <div className="grid gap-3">
        {sites.map(s => (
          <div key={s.id} className="border p-4 rounded flex justify-between items-center bg-white shadow-sm">
            <div>
              <div className="font-bold text-lg">{s.name} <span className="text-xs bg-gray-100 px-2 py-1 rounded ml-2">{s.status}</span></div>
              <div className="text-sm text-gray-600">{s.user?.email || s.userId} | Pages: {s.pages?.length || 0}</div>
              <div className="text-xs font-mono text-blue-600">Subdomain: {s.subdomain} → /s/{s.subdomain}</div>
              <div className="text-[11px] text-gray-400">ID: {s.id}</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/builder/${s.id}`} className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-bold">Builder</Link>
              <Link href={`/s/${s.subdomain}`} target="_blank" className="border px-5 py-2 rounded text-sm">Live</Link>
            </div>
          </div>
        ))}
        {sites.length===0 && <div className="text-center p-10 border-dashed border rounded text-gray-500">No sites yet — create first one above</div>}
      </div>
    </div>
  );
}


