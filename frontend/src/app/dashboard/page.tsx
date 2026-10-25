"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  apiRequest,
  downloadProjectFile,
  uploadProjectFile,
  type Project,
} from "@/lib/project-delivery";

const services = [
  "Document Review", "Document Editing", "CV Writing", "Cover Letter Writing",
  "Business Reports", "Data Analysis", "Business Analysis", "Business Automation", "AI Consulting",
];

const uploadAccept = ".docx,.doc,.pdf,.xlsx,.xls,.csv,.pptx,.txt,.json,.xml,.zip,.png,.jpg,.jpeg,.webp";

function fileSize(size: string | number): string {
  const n = typeof size === "string" ? Number(size) : size;
  if (!n) return "0 MB";
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClientDashboardPage() {
  const [token, setToken] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [maximumUploadMegabytes, setMaximumUploadMegabytes] = useState(100);
  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState(services[0]);
  const [description, setDescription] = useState("");
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProjects = useCallback(async (accessToken: string) => {
    const data = await apiRequest<Project[]>("/projects", accessToken);
    setProjects(data);
  }, []);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || "";
    if (!accessToken) { setLoading(false); return; }
    setToken(accessToken);
    void apiRequest<{ maximumMegabytes: number }>("/settings/project-upload-limit", accessToken)
      .then((s) => setMaximumUploadMegabytes(s.maximumMegabytes))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load upload limit"));
    void loadProjects(accessToken)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load projects"))
      .finally(() => setLoading(false));
  }, [loadProjects]);

  useEffect(() => {
    if (!token) return;
    const t = window.setInterval(() => {
      void loadProjects(token).catch((e) => setError(e instanceof Error ? e.message : "Refresh failed"));
    }, 15000);
    return () => window.clearInterval(t);
  }, [loadProjects, token]);

  async function createProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true); setError(""); setNotice("");
    try {
      const project = await apiRequest<Project>("/projects", token, {
        method: "POST",
        body: JSON.stringify({ title, serviceType, description }),
      });
      setProjects((c) => [project, ...c]);
      setTitle(""); setDescription("");
      setNotice("Your service request was submitted as a project.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
    } finally { setSubmitting(false); }
  }

  async function uploadFile(projectId: string, file: File) {
    if (file.size > maximumUploadMegabytes * 1024 * 1024) {
      setError(`Choose a file no larger than ${maximumUploadMegabytes} MB.`); return;
    }
    const key = `${projectId}:${file.name}`;
    setError(""); setNotice("");
    setProgress((c) => ({ ...c, [key]: 0 }));
    try {
      await uploadProjectFile(projectId, file, token, "CLIENT_UPLOAD", (p) => setProgress((c) => ({ ...c, [key]: p })));
      await loadProjects(token);
      setNotice(`${file.name} uploaded.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setProgress((c) => { const n = { ...c }; delete n[key]; return n; });
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <main className="mx-auto max-w-6xl px-6 py-16 animate-pulse">
        <div className="h-8 w-40 bg-zinc-200 rounded-full" />
        <div className="mt-4 h-10 w-64 bg-zinc-200 rounded-xl" />
      </main>
    </div>
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-[#FCFCF9]">
        <main className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Client portal</p>
          <h1 className="mt-4 text-4xl font-bold text-zinc-900">Sign in required</h1>
          <p className="mt-3 text-zinc-500">Sign in to request services, upload files, and download deliverables.</p>
          <Link href="/login" className="mt-6 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-black">Sign in</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Client portal</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900">My projects</h1>
            <p className="mt-3 max-w-2xl text-zinc-500">Submit a service request, securely exchange files, and receive deliverables.</p>
          </div>
          <Link href="/dashboard/cvs" className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">Open CV library →</Link>
        </header>

        {(error || notice) && (
          <div role={error ? "alert" : "status"} className={`mt-6 rounded-[16px] border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            {error || notice}
          </div>
        )}

        {/* Request Form - Premium */}
        <section className="mt-8 rounded-[24px] border border-zinc-200 bg-white p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <h2 className="text-lg font-semibold text-zinc-900">Request a service</h2>
          <form onSubmit={createProject} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-zinc-700">Service
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="mt-2 w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none">
                {services.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-zinc-700">Project title
              <input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900 focus:outline-none" placeholder="e.g. Review sales proposal" />
            </label>
            <label className="text-sm font-medium text-zinc-700 md:col-span-2">Instructions
              <textarea required minLength={5} maxLength={10000} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900 focus:outline-none" placeholder="Describe the work..." />
            </label>
            <div className="md:col-span-2">
              <button type="submit" disabled={submitting} className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-60">
                {submitting ? "Submitting…" : "Submit request"}
              </button>
            </div>
          </form>
        </section>

        {/* Workspace */}
        <section className="mt-12 space-y-6">
          <h2 className="text-xl font-semibold text-zinc-900">Project workspace</h2>
          {projects.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">No projects yet. Submit above to start.</div>
          ) : projects.map((project) => (
            <article key={project.id} className="rounded-[24px] border border-zinc-200 bg-white p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{project.serviceType}</p>
                  <h3 className="mt-1.5 text-xl font-bold text-zinc-900">{project.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 max-w-2xl">{project.description}</p>
                </div>
                <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white capitalize">{project.status.replaceAll("_", " ").toLowerCase()}</span>
              </div>
              <p className="mt-3 text-xs text-zinc-500">Consultant: {project.assignee?.name ?? "Not yet assigned"} • {new Date(project.updatedAt).toLocaleString()}</p>

              <div className="mt-7 grid gap-7 lg:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900">Files & deliverables</h4>
                  <ul className="mt-3 space-y-2">
                    {project.files.map((file) => (
                      <li key={file.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-zinc-50 border border-zinc-100 p-3 text-sm">
                        <span className="text-zinc-700 truncate">{file.originalName} <span className="text-zinc-400">v{file.version} • {fileSize(file.size)} • {file.status.toLowerCase()}</span></span>
                        {file.status === "AVAILABLE" && file.kind === "DELIVERABLE" && (
                          <button onClick={() => void downloadProjectFile(project.id, file.id, token).catch((e: unknown) => setError(e instanceof Error ? e.message : "Download failed"))} className="text-xs font-semibold text-zinc-900 underline decoration-[#D4AF37] underline-offset-4">Download</button>
                        )}
                      </li>
                    ))}
                    {project.files.length === 0 && <li className="text-sm text-zinc-400 py-2">No files yet.</li>}
                  </ul>
                  <label className="mt-4 block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Upload (up to {maximumUploadMegabytes} MB)</span>
                    <input type="file" accept={uploadAccept} className="mt-2 block w-full rounded-[12px] border border-zinc-200 bg-white p-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white" onChange={(e) => { const f = e.currentTarget.files?.[0]; e.currentTarget.value = ""; if (f) void uploadFile(project.id, f); }} />
                  </label>
                  {Object.entries(progress).filter(([k]) => k.startsWith(`${project.id}:`)).map(([k, p]) => (
                    <div key={k} className="mt-3"><div className="flex justify-between text-xs text-zinc-500"><span>{k.split(":").slice(1).join(":")}</span><span>{p}%</span></div><div className="mt-1 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${p}%` }} /></div></div>
                  ))}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-zinc-900">Messages</h4>
                  <div className="mt-3 max-h-56 space-y-3 overflow-y-auto rounded-[12px] bg-zinc-50 border border-zinc-100 p-3">
                    {project.messages.map((m) => (
                      <div key={m.id} className="text-sm"><p className="font-semibold text-zinc-900">{m.author.name} <span className="font-normal text-zinc-400">• {new Date(m.createdAt).toLocaleString()}</span></p><p className="whitespace-pre-wrap text-zinc-600 mt-1">{m.body}</p></div>
                    ))}
                    {project.messages.length === 0 && <p className="text-sm text-zinc-400">No messages yet.</p>}
                  </div>
                  <form onSubmit={(e) => void (async () => { const b = messages[project.id]?.trim(); if (!b) return; setError(""); try { await apiRequest(`/projects/${encodeURIComponent(project.id)}/messages`, token, { method: "POST", body: JSON.stringify({ body: b }) }); setMessages((c) => ({ ...c, [project.id]: "" })); await loadProjects(token); } catch (err) { setError(err instanceof Error ? err.message : "Send failed"); } })()} className="mt-3 flex gap-2">
                    <input required maxLength={5000} value={messages[project.id] ?? ""} onChange={(e) => setMessages((c) => ({ ...c, [project.id]: e.target.value }))} className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm focus:border-zinc-900 focus:outline-none" placeholder="Write a message…" />
                    <button type="submit" className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">Send</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
