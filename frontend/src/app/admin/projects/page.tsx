"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  apiRequest,
  downloadProjectFile,
  uploadProjectFile,
  type Project,
} from "@/lib/project-delivery";

type Staff = { id: string; name: string; email: string };
type FileAnalysis = { summary: string; keyInsights: string[]; recommendations: string[]; createdAt: string };
const statuses = ["PENDING", "ASSIGNED", "IN_PROGRESS", "REVIEW", "CLIENT_FEEDBACK", "COMPLETED", "DELIVERED", "ARCHIVED"];
const uploadAccept = ".docx,.doc,.pdf,.xlsx,.xls,.csv,.pptx,.txt,.json,.xml,.zip,.png,.jpg,.jpeg,.webp";

export default function AdminProjectsPage() {
  const [token, setToken] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [maximumUploadMegabytes, setMaximumUploadMegabytes] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [fileAnalyses, setFileAnalyses] = useState<Record<string, FileAnalysis>>({});
  const [analysisBusy, setAnalysisBusy] = useState("");

  const refresh = useCallback(async (accessToken: string) => {
    const [projectData, staffData] = await Promise.all([
      apiRequest<Project[]>("/projects", accessToken),
      apiRequest<Staff[]>("/projects/staff", accessToken),
    ]);
    setProjects(projectData);
    setStaff(staffData);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Sign in with an administrator account to manage projects.");
        setLoading(false);
        return;
      }
      setToken(accessToken);
      void apiRequest<{ maximumMegabytes: number }>("/settings/project-upload-limit", accessToken)
        .then((settings) => setMaximumUploadMegabytes(settings.maximumMegabytes))
        .catch((e: any) => setError(e.message));
      void refresh(accessToken).catch((e: any) => setError(e.message)).finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (!token) return;
    const timer = window.setInterval(() => void refresh(token).catch((e: any) => setError(e.message)), 15000);
    return () => window.clearInterval(timer);
  }, [refresh, token]);

  async function updateProject(projectId: string, path: "status" | "assignee", body: object) {
    setError(""); setNotice("");
    try {
      await apiRequest(`/projects/${encodeURIComponent(projectId)}/${path}`, token, { method: "PATCH", body: JSON.stringify(body) });
      await refresh(token); setNotice("Project updated.");
    } catch (e: any) { setError(e.message); }
  }

  async function analyzeFile(projectId: string, fileId: string) {
    if (!window.confirm("Client authorized sending extracted text to external AI?")) return;
    setAnalysisBusy(fileId); setError(""); setNotice("");
    try {
      const report = await apiRequest<FileAnalysis>(`/ai/admin/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/analyze`, token, {
        method: "POST", body: JSON.stringify({ confirmExternalProcessing: true }),
      });
      setFileAnalyses((c) => ({ ...c, [fileId]: report }));
      setNotice("AI analysis completed. Review before sharing.");
    } catch (e: any) { setError(e.message); } finally { setAnalysisBusy(""); }
  }

  async function loadAnalysis(projectId: string, fileId: string) {
    setAnalysisBusy(fileId); setError("");
    try {
      const report = await apiRequest<FileAnalysis | null>(`/ai/admin/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/analysis`, token);
      if (!report) { setNotice("No saved AI report."); return; }
      setFileAnalyses((c) => ({ ...c, [fileId]: report }));
    } catch (e: any) { setError(e.message); } finally { setAnalysisBusy(""); }
  }

  async function uploadDeliverable(projectId: string, file: File) {
    if (file.size > maximumUploadMegabytes * 1024 * 1024) { setError(`Max ${maximumUploadMegabytes} MB`); return; }
    const key = `${projectId}:${file.name}`; setProgress((c) => ({ ...c, [key]: 0 }));
    try {
      await uploadProjectFile(projectId, file, token, "DELIVERABLE", (p) => setProgress((c) => ({ ...c, [key]: p })));
      await refresh(token); setNotice(`${file.name} delivered.`);
    } catch (e: any) { setError(e.message); } finally { setProgress((c) => { const n = { ...c }; delete n[key]; return n; }); }
  }

  async function sendMessage(projectId: string) {
    const body = messageDrafts[projectId]?.trim(); if (!body) return;
    try {
      await apiRequest(`/projects/${encodeURIComponent(projectId)}/messages`, token, { method: "POST", body: JSON.stringify({ body }) });
      setMessageDrafts((c) => ({ ...c, [projectId]: "" })); await refresh(token);
    } catch (e: any) { setError(e.message); }
  }

  async function deleteMessage(projectId: string, messageId: string) {
    if (!window.confirm("Delete this message? Client will not see it anymore.")) return;
    try {
      await apiRequest(`/projects/${encodeURIComponent(projectId)}/messages/${encodeURIComponent(messageId)}`, token, { method: "DELETE" });
      await refresh(token); setNotice("Message deleted.");
    } catch (e: any) { setError(e.message); }
  }

  async function deleteFile(projectId: string, fileId: string, name: string) {
    if (!window.confirm(`Delete file ${name}?`)) return;
    try {
      await apiRequest(`/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}`, token, { method: "DELETE" });
      await refresh(token); setNotice("File deleted.");
    } catch (e: any) { setError(e.message); }
  }

  async function refreshScan(projectId: string, fileId: string) {
    try { await apiRequest(`/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/scan-status`, token); await refresh(token); }
    catch (e: any) { setError(e.message); }
  }

  if (loading) return <main className="mx-auto max-w-7xl px-6 py-16">Loading projects…</main>;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Administration</p>
          <h1 className="mt-2 text-4xl font-bold">Project center</h1>
          <p className="mt-3 text-slate-600">WhatsApp-style chat, file management, AI analysis with DB-only storage.</p>
        </div>
        <Link href="/admin" className="rounded-md border px-4 py-2 font-semibold">Admin dashboard</Link>
      </header>

      {(error || notice) && <p className={`mt-6 rounded-lg p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{error || notice}</p>}

      <section className="mt-8 space-y-6">
        {projects.map((project) => (
          <article key={project.id} className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8A6A00]">{project.serviceType}</p>
                <h2 className="mt-1 text-2xl font-bold">{project.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-slate-600">{project.description}</p>
                <p className="mt-3 text-sm text-slate-500">Client: {project.owner.name} · {project.owner.email}</p>
              </div>
              <div className="grid content-start gap-3 sm:grid-cols-2 xl:w-[430px]">
                <label className="text-sm font-medium">Status
                  <select value={project.status} onChange={(e) => void updateProject(project.id, "status", { status: e.target.value })} className="mt-1 w-full rounded-md border p-2">
                    {statuses.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium">Consultant
                  <select value={project.assignee?.id ?? ""} onChange={(e) => void updateProject(project.id, "assignee", { assigneeId: e.target.value || null })} className="mt-1 w-full rounded-md border p-2">
                    <option value="">Unassigned</option>{staff.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Files */}
              <section>
                <h3 className="font-semibold">Files and deliverables</h3>
                <ul className="mt-3 space-y-3 text-sm">
                  {project.files.map((file) => (
                    <li key={file.id} className="rounded-md bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span><strong>{file.originalName}</strong> · {file.kind} · v{file.version} · {file.status}</span>
                        <div className="flex flex-wrap gap-2">
                          {file.status === "AVAILABLE" && (
                            <>
                              <button onClick={() => void downloadProjectFile(project.id, file.id, token).catch((e: any) => setError(e.message))} className="font-semibold underline">View / Download</button>
                              {/\.(pdf|docx|xlsx|pptx|csv|txt)$/i.test(file.originalName) && (
                                <>
                                  <button disabled={analysisBusy === file.id} onClick={() => void analyzeFile(project.id, file.id)} className="font-semibold underline disabled:opacity-50">Analyze AI</button>
                                  <button disabled={analysisBusy === file.id} onClick={() => void loadAnalysis(project.id, file.id)} className="font-semibold underline disabled:opacity-50">View report</button>
                                </>
                              )}
                              <button onClick={() => void deleteFile(project.id, file.id, file.originalName)} className="text-red-600 underline">Delete</button>
                            </>
                          )}
                          {file.status === "SCANNING" && <button onClick={() => void refreshScan(project.id, file.id)} className="underline">Refresh scan</button>}
                        </div>
                      </div>
                      {fileAnalyses[file.id] && (
                        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm">
                          <p className="font-semibold">AI summary · {new Date(fileAnalyses[file.id].createdAt).toLocaleString()}</p>
                          <p className="mt-2 whitespace-pre-wrap">{fileAnalyses[file.id].summary}</p>
                          <p className="mt-3 font-semibold">Key insights</p>
                          <ul className="mt-1 list-disc pl-5">{(fileAnalyses[file.id].keyInsights ?? []).map((k, i) => <li key={`${i}-${k}`}>{k}</li>)}</ul>
                          <p className="mt-3 font-semibold">Recommendations</p>
                          <ul className="mt-1 list-disc pl-5">{(fileAnalyses[file.id].recommendations ?? []).map((k, i) => <li key={`${i}-${k}`}>{k}</li>)}</ul>
                        </div>
                      )}
                    </li>
                  ))}
                  {project.files.length === 0 && <li className="text-slate-500">No files yet.</li>}
                </ul>
                <label className="mt-4 block text-sm font-medium">Upload deliverable
                  <input type="file" accept={uploadAccept} className="mt-2 block w-full rounded-md border p-2" onChange={(e) => {
                    const f = e.currentTarget.files?.[0]; e.currentTarget.value = ""; if (f) void uploadDeliverable(project.id, f);
                  }} />
                </label>
                {Object.entries(progress).filter(([k]) => k.startsWith(`${project.id}:`)).map(([k, p]) => <p key={k} className="mt-2 text-sm">{k.split(":").slice(1).join(":")}: {p}%</p>)}
              </section>

              {/* WhatsApp Chat + Delete Message */}
              <section>
                <h3 className="font-semibold">Project messages — WhatsApp style</h3>
                <div className="mt-3 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl bg-[#ECE5DD] p-4">
                  {project.messages.map((m) => {
                    const isAdmin = (m.author.role || "").toUpperCase().includes("ADMIN");
                    return (
                      <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        <div className={`group relative max-w-[78%] rounded-2xl px-4 py-2 shadow ${isAdmin ? "bg-[#DCF8C6] text-slate-900 rounded-br-sm" : "bg-white rounded-bl-sm"}`}>
                          <p className="text-[11px] font-semibold opacity-60">{m.author.name} • {new Date(m.createdAt).toLocaleTimeString()}</p>
                          <p className="mt-1 whitespace-pre-wrap text-[14px]">{m.body}</p>
                          <button onClick={() => void deleteMessage(project.id, m.id)} className="absolute -top-2 -right-2 hidden group-hover:block bg-red-600 text-white text-[10px] w-5 h-5 rounded-full">✕</button>
                        </div>
                      </div>
                    );
                  })}
                  {project.messages.length === 0 && <p className="text-sm text-slate-500 text-center py-10">No messages yet.</p>}
                </div>
                <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void sendMessage(project.id); }}>
                  <input required maxLength={5000} value={messageDrafts[project.id] ?? ""} onChange={(e) => setMessageDrafts((c) => ({ ...c, [project.id]: e.target.value }))} className="min-w-0 flex-1 rounded-full border p-2 px-4" placeholder="Reply as admin…" />
                  <button type="submit" className="rounded-full bg-[#25D366] px-5 py-2 font-semibold text-white">Send</button>
                </form>
              </section>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

