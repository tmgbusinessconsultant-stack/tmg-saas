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
        .catch((settingsError: unknown) => setError(settingsError instanceof Error ? settingsError.message : "Could not load the upload limit."));
      void refresh(accessToken)
        .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Could not load projects."))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (!token) return;
    const timer = window.setInterval(() => {
      void refresh(token).catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Could not refresh projects.");
      });
    }, 15000);
    return () => window.clearInterval(timer);
  }, [refresh, token]);

  async function updateProject(projectId: string, path: "status" | "assignee", body: object) {
    setError("");
    setNotice("");
    try {
      await apiRequest(`/projects/${encodeURIComponent(projectId)}/${path}`, token, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await refresh(token);
      setNotice("Project updated.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Project could not be updated.");
    }
  }

  async function analyzeFile(projectId: string, fileId: string) {
    if (!window.confirm("Confirm that the client has authorized sending this file’s extracted text to TMG’s configured external AI provider for analysis. Only malware-scanned files of 10 MB or less are sent.")) return;
    setAnalysisBusy(fileId);
    setError("");
    setNotice("");
    try {
      const report = await apiRequest<FileAnalysis>(`/ai/admin/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/analyze`, token, {
        method: "POST",
        body: JSON.stringify({ confirmExternalProcessing: true }),
      });
      setFileAnalyses((current) => ({ ...current, [fileId]: report }));
      setNotice("AI file analysis completed. Review the generated findings before sharing them.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not analyze project file.");
    } finally {
      setAnalysisBusy("");
    }
  }

  async function loadAnalysis(projectId: string, fileId: string) {
    setAnalysisBusy(fileId);
    setError("");
    try {
      const report = await apiRequest<FileAnalysis | null>(`/ai/admin/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/analysis`, token);
      if (!report) {
        setNotice("No saved AI report exists for this file.");
        return;
      }
      setFileAnalyses((current) => ({ ...current, [fileId]: report }));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not load the AI report.");
    } finally {
      setAnalysisBusy("");
    }
  }

  async function uploadDeliverable(projectId: string, file: File) {
    if (file.size > maximumUploadMegabytes * 1024 * 1024) {
      setError(`Choose a file no larger than ${maximumUploadMegabytes} MB.`);
      return;
    }
    const key = `${projectId}:${file.name}`;
    setError("");
    setNotice("");
    setProgress((current) => ({ ...current, [key]: 0 }));
    try {
      await uploadProjectFile(projectId, file, token, "DELIVERABLE", (percent) => {
        setProgress((current) => ({ ...current, [key]: percent }));
      });
      await refresh(token);
      setNotice(`${file.name} is available to the client.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Deliverable upload failed.");
    } finally {
      setProgress((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  async function sendMessage(projectId: string) {
    const body = messageDrafts[projectId]?.trim();
    if (!body) return;
    setError("");
    try {
      await apiRequest(`/projects/${encodeURIComponent(projectId)}/messages`, token, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setMessageDrafts((current) => ({ ...current, [projectId]: "" }));
      await refresh(token);
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : "Message could not be sent.");
    }
  }

  async function refreshScan(projectId: string, fileId: string) {
    setError("");
    try {
      await apiRequest(
        `/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/scan-status`,
        token,
      );
      await refresh(token);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Could not refresh the malware scan status.");
    }
  }

  if (loading) return <main className="mx-auto max-w-7xl px-6 py-16" role="status">Loading projects…</main>;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Administration</p>
          <h1 className="mt-2 text-4xl font-bold">Project center</h1>
          <p className="mt-3 text-slate-600">Review client requests, manage progress, exchange messages, and deliver finished files.</p>
        </div>
        <Link href="/admin" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Admin dashboard</Link>
      </header>

      {(error || notice) && <p role={error ? "alert" : "status"} className={`mt-6 rounded-lg p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{error || notice}</p>}

      {!token ? (
        <div className="mt-8 rounded-xl border border-slate-200 p-6">
          <p>{error}</p>
          <Link href="/login" className="mt-4 inline-block font-semibold underline">Sign in</Link>
        </div>
      ) : projects.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-slate-600">No client projects yet.</p>
      ) : (
        <section className="mt-8 space-y-6">
          {projects.map((project) => (
            <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8A6A00]">{project.serviceType}</p>
                  <h2 className="mt-1 text-2xl font-bold">{project.title}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-slate-600">{project.description}</p>
                  <p className="mt-3 text-sm text-slate-500">Client: {project.owner.name} · {project.owner.email}</p>
                </div>
                <div className="grid content-start gap-3 sm:grid-cols-2 xl:w-[430px]">
                  <label className="text-sm font-medium">
                    Status
                    <select value={project.status} onChange={(event) => void updateProject(project.id, "status", { status: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 p-2">
                      {statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-medium">
                    Assigned consultant
                    <select value={project.assignee?.id ?? ""} onChange={(event) => void updateProject(project.id, "assignee", { assigneeId: event.target.value || null })} className="mt-1 w-full rounded-md border border-slate-300 p-2">
                      <option value="">Unassigned</option>
                      {staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <section>
                  <h3 className="font-semibold">Files and deliverables</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {project.files.map((file) => (
                      <li key={file.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 p-3">
                        <span>
                          <strong>{file.originalName}</strong> · {file.kind.replaceAll("_", " ")} · v{file.version} · {file.status === "SCANNING" ? "virus scan pending" : file.status}
                        </span>
                        {file.status === "AVAILABLE" && (
                          <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={() => void downloadProjectFile(project.id, file.id, token).catch((downloadError: unknown) => setError(downloadError instanceof Error ? downloadError.message : "Download failed."))} className="font-semibold underline">Download</button>
                            {/\.(pdf|docx|xlsx|pptx|csv|txt)$/i.test(file.originalName) && Number(file.size) <= 10 * 1024 * 1024 && <>
                              <button type="button" disabled={analysisBusy === file.id} onClick={() => { void analyzeFile(project.id, file.id); }} className="font-semibold underline disabled:opacity-50">Analyze with AI</button>
                              <button type="button" disabled={analysisBusy === file.id} onClick={() => { void loadAnalysis(project.id, file.id); }} className="font-semibold underline disabled:opacity-50">View report</button>
                            </>}
                          </div>
                        )}
                        {fileAnalyses[file.id] && <div className="mt-3 w-full rounded-md border border-blue-200 bg-blue-50 p-4 text-sm">
                          <p className="font-semibold">AI summary · {new Date(fileAnalyses[file.id].createdAt).toLocaleString()}</p>
                          <p className="mt-2 whitespace-pre-wrap">{fileAnalyses[file.id].summary}</p>
                          <p className="mt-3 font-semibold">Key insights</p><ul className="mt-1 list-disc space-y-1 pl-5">{fileAnalyses[file.id].keyInsights.map((insight, index) => <li key={`${index}-${insight}`}>{insight}</li>)}</ul>
                          <p className="mt-3 font-semibold">Recommendations</p><ul className="mt-1 list-disc space-y-1 pl-5">{fileAnalyses[file.id].recommendations.map((recommendation, index) => <li key={`${index}-${recommendation}`}>{recommendation}</li>)}</ul>
                          <p className="mt-3 text-xs text-slate-600">AI-generated draft; verify figures and recommendations before sharing.</p>
                        </div>}
                        {file.status === "SCANNING" && <button type="button" onClick={() => void refreshScan(project.id, file.id)} className="font-semibold underline">Refresh scan</button>}
                      </li>
                    ))}
                    {project.files.length === 0 && <li className="text-slate-500">No project files yet.</li>}
                  </ul>
                  <label className="mt-4 block text-sm font-medium">
                    Upload deliverable (up to {maximumUploadMegabytes} MB)
                    <input type="file" accept={uploadAccept} className="mt-2 block w-full rounded-md border border-slate-300 p-2" onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (file) void uploadDeliverable(project.id, file);
                    }} />
                  </label>
                  {Object.entries(progress).filter(([key]) => key.startsWith(`${project.id}:`)).map(([key, percent]) => <p key={key} role="status" className="mt-2 text-sm text-slate-600">{key.split(":").slice(1).join(":")}: {percent}% uploaded</p>)}
                </section>

                <section>
                  <h3 className="font-semibold">Project messages</h3>
                  <div className="mt-3 max-h-56 space-y-3 overflow-y-auto rounded-md bg-slate-50 p-3">
                    {project.messages.map((message) => (
                      <div key={message.id} className="text-sm">
                        <p className="font-semibold">{message.author.name} <span className="font-normal text-slate-500">· {new Date(message.createdAt).toLocaleString()}</span></p>
                        <p className="whitespace-pre-wrap text-slate-700">{message.body}</p>
                      </div>
                    ))}
                    {project.messages.length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}
                  </div>
                  <form className="mt-3 flex gap-2" onSubmit={(event) => {
                    event.preventDefault();
                    void sendMessage(project.id);
                  }}>
                    <input required maxLength={5000} value={messageDrafts[project.id] ?? ""} onChange={(event) => setMessageDrafts((current) => ({ ...current, [project.id]: event.target.value }))} className="min-w-0 flex-1 rounded-md border border-slate-300 p-2" placeholder="Write to the client…" />
                    <button type="submit" className="rounded-md bg-[#0F172A] px-4 py-2 font-semibold text-white">Send</button>
                  </form>
                </section>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}




