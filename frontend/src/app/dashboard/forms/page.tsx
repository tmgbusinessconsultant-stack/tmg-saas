"use client";
import { useEffect, useState } from "react";

type Site = { id: string; name?: string; subdomain?: string };
type ManagedForm = { id: string; name: string; fields?: unknown[]; _count?: { submissions?: number } };

export default function FormsDashboard() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [forms, setForms] = useState<ManagedForm[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", fields: [{ id: "name", label: "Name", type: "text", required: true }] });

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:4000/api/sites", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setSites(d.data || d)).catch(() => {});
  }, []);

  const loadForms = async (siteId: string) => {
    setSelectedSite(siteId);
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:4000/api/sites/${siteId}/forms`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setForms(data);
  };

  const createForm = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:4000/api/sites/${selectedSite}/forms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newForm.name, fields: newForm.fields, type: "contact", isActive: true, settings: { submitText: "Submit", successMessage: "Thank you!" } }),
    });
    const created = await res.json();
    setForms([created, ...forms]);
    setShowCreate(false);
    setNewForm({ name: "", fields: [{ id: "name", label: "Name", type: "text", required: true }] });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black mb-6">📝 Forms Manager</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {sites.map(s => (
          <button key={s.id} onClick={() => loadForms(s.id)} className={`px-4 py-2 rounded-lg border ${selectedSite === s.id ? "bg-black text-white" : "bg-white"}`}>{s.name || s.subdomain}</button>
        ))}
      </div>
      {selectedSite && (
        <>
          <div className="flex justify-between mb-4">
            <h2 className="font-bold text-xl">Forms for {selectedSite}</h2>
            <button onClick={() => setShowCreate(true)} className="bg-black text-white px-4 py-2 rounded-lg">+ New Form</button>
          </div>
          <div className="grid gap-4">
            {forms.map(f => (
              <div key={f.id} className="border p-4 rounded-xl bg-white flex justify-between">
                <div><div className="font-bold">{f.name}</div><div className="text-xs text-gray-500 font-mono">{f.id}</div><div className="text-sm">{f.fields?.length || 0} fields — {f._count?.submissions || 0} submissions</div></div>
                <div className="text-xs">Copy ID to Builder: <b>{f.id}</b></div>
              </div>
            ))}
            {forms.length === 0 && <div className="text-gray-400">No forms yet — create one</div>}
          </div>
        </>
      )}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full">
            <h3 className="font-bold text-lg mb-4">Create Form</h3>
            <input value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} placeholder="Contact Us Form" className="w-full border p-3 rounded-lg mb-4" />
            <div className="text-xs text-gray-500 mb-4">Default fields: Name, Email, Message — you can edit in DB or extend UI later</div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={createForm} className="px-4 py-2 bg-black text-white rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
