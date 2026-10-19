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
  "Document Review",
  "Document Editing",
  "CV Writing",
  "Cover Letter Writing",
  "Business Reports",
  "Data Analysis",
  "Business Analysis",
  "Business Automation",
  "AI Consulting",
];

const uploadAccept = ".docx,.doc,.pdf,.xlsx,.xls,.csv,.pptx,.txt,.json,.xml,.zip,.png,.jpg,.jpeg,.webp";

function fileSize(size: string): string {
  return `${(Number(size) / (1024 * 1024)).toFixed(1)} MB`;
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
    const timer = window.setTimeout(() => {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        setLoading(false);
        return;
      }
      setToken(accessToken);
      void apiRequest<{ maximumMegabytes: number }>("/settings/project-upload-limit", accessToken)
        .then((settings) => setMaximumUploadMegabytes(settings.maximumMegabytes))
        .catch((settingsError: unknown) => setError(settingsError instanceof Error ? settingsError.message : "Could not load the upload limit."));
      void loadProjects(accessToken)
        .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Could not load your projects."))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProjects]);

  useEffect(() => {
    if (!token) return;
    const timer = window.setInterval(() => {
      void loadProjects(token).catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Could not refresh your projects.");
      });
    }, 15000);
    return () => window.clearInterval(timer);
  }, [loadProjects, token]);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const project = await apiRequest<Project>("/projects", token, {
        method: "POST",
        body: JSON.stringify({ title, serviceType, description }),
      });
      setProjects((current) => [project, ...current]);
      setTitle("");
      setDescription("");
      setNotice("Your service request was submitted as a project.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create the project.");
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadFile(projectId: string, file: File) {
    if (file.size > maximumUploadMegabytes * 1024 * 1024) {
      setError(`Choose a file no larger than ${maximumUploadMegabytes} MB.`);
      return;
    }
    const key = `${projectId}:${file.name}`;
    setError("");
    setNotice("");
    setProgress((current) => ({ ...current, [key]: 0 }));
    try {
      await uploadProjectFile(projectId, file, token, "CLIENT_UPLOAD", (percent) => {
        setProgress((current) => ({ ...current, [key]: percent }));
      });
      await loadProjects(token);
      setNotice(`${file.name} uploaded to the project.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The file could not be uploaded.");
    } finally {
      setProgress((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  async function refreshScan(projectId: string, fileId: string) {
    setError("");
    try {
      await apiRequest(
        `/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/scan-status`,
        token,
      );
      await loadProjects(token);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Could not refresh the malware scan status.");
    }
  }

  async function sendMessage(projectId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = messages[projectId]?.trim();
    if (!body) return;
    setError("");
    try {
      await apiRequest(`/projects/${encodeURIComponent(projectId)}/messages`, token, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setMessages((current) => ({ ...current, [projectId]: "" }));
      await loadProjects(token);
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : "Message could not be sent.");
    }
  }

  if (loading) return <main className="mx-auto max-w-6xl px-6 py-16" role="status">Loading your projects…</main>;
  if (!token) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold">Client portal</h1>
        <p className="mt-3 text-slate-600">Sign in to request services, upload project files, message the consultant, and download completed deliverables.</p>
        <Link href="/login" className="mt-6 inline-block rounded-md bg-[#0F172A] px-5 py-3 font-semibold text-white">Sign in</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Client portal</p>
        <h1 className="mt-2 text-4xl font-bold">My projects</h1>
        <p className="mt-3 text-slate-600">Submit a service request, securely exchange project files, and receive consultant deliverables here.</p>
        <Link href="/dashboard/cvs" className="mt-4 inline-block font-semibold text-[#8A6A00] underline">Open my CV library</Link>
      </header>

      {(error || notice) && (
        <p role={error ? "alert" : "status"} className={`mt-6 rounded-lg p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
          {error || notice}
        </p>
      )}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Request a service</h2>
        <form onSubmit={createProject} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Service
            <select value={serviceType} onChange={(event) => setServiceType(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-3">
              {services.map((service) => <option key={service}>{service}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            Project title
            <input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-3" placeholder="e.g. Review sales proposal" />
          </label>
          <label className="text-sm font-medium md:col-span-2">
            Instructions and project details
            <textarea required minLength={5} maxLength={10000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-3" placeholder="Describe the work you need and any requirements." />
          </label>
          <div className="md:col-span-2">
            <button type="submit" disabled={submitting} className="rounded-md bg-[#0F172A] px-5 py-3 font-semibold text-white disabled:opacity-60">
              {submitting ? "Submitting…" : "Submit service request"}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-10 space-y-6">
        <h2 className="text-2xl font-bold">Project workspace</h2>
        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-slate-600">You do not have any projects yet. Submit a service request above to get started.</div>
        ) : projects.map((project) => (
          <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8A6A00]">{project.serviceType}</p>
                <h3 className="mt-1 text-xl font-bold">{project.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{project.description}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">{project.status.replaceAll("_", " ")}</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Consultant: {project.assignee?.name ?? "Not yet assigned"} · Updated {new Date(project.updatedAt).toLocaleString()}
            </p>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section>
                <h4 className="font-semibold">Project files and deliverables</h4>
                <ul className="mt-3 space-y-2 text-sm">
                  {project.files.map((file) => (
                    <li key={file.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 p-3">
                      <span>{file.originalName} <span className="text-slate-500">v{file.version} · {fileSize(file.size)} · {file.status === "SCANNING" ? "virus scan pending" : file.status.toLowerCase()}</span></span>
                      {file.status === "AVAILABLE" && file.kind === "DELIVERABLE" ? (
                        <button type="button" onClick={() => void downloadProjectFile(project.id, file.id, token).catch((downloadError: unknown) => setError(downloadError instanceof Error ? downloadError.message : "Download failed."))} className="font-semibold underline">
                          Download
                        </button>
                      ) : file.status === "SCANNING" ? (
                        <button type="button" onClick={() => void refreshScan(project.id, file.id)} className="font-semibold underline">Refresh scan</button>
                      ) : file.kind === "CLIENT_UPLOAD" ? <span className="text-slate-500">Submitted</span> : null}
                    </li>
                  ))}
                  {project.files.length === 0 && <li className="text-slate-500">No files uploaded or delivered yet.</li>}
                </ul>
                <label className="mt-4 block text-sm font-medium">
                  Upload project file (up to {maximumUploadMegabytes} MB)
                  <input
                    type="file"
                    accept={uploadAccept}
                    className="mt-2 block w-full rounded-md border border-slate-300 p-2"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (file) void uploadFile(project.id, file);
                    }}
                  />
                </label>
                {Object.entries(progress).filter(([key]) => key.startsWith(`${project.id}:`)).map(([key, percent]) => (
                  <p key={key} className="mt-2 text-sm text-slate-600" role="status">{key.split(":").slice(1).join(":")}: {percent}% uploaded</p>
                ))}
              </section>

              <section>
                <h4 className="font-semibold">Messages</h4>
                <div className="mt-3 max-h-56 space-y-3 overflow-y-auto rounded-md bg-slate-50 p-3">
                  {project.messages.map((message) => (
                    <div key={message.id} className="text-sm">
                      <p className="font-semibold">{message.author.name} <span className="font-normal text-slate-500">· {new Date(message.createdAt).toLocaleString()}</span></p>
                      <p className="whitespace-pre-wrap text-slate-700">{message.body}</p>
                    </div>
                  ))}
                  {project.messages.length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}
                </div>
                <form onSubmit={(event) => void sendMessage(project.id, event)} className="mt-3 flex gap-2">
                  <input required maxLength={5000} value={messages[project.id] ?? ""} onChange={(event) => setMessages((current) => ({ ...current, [project.id]: event.target.value }))} className="min-w-0 flex-1 rounded-md border border-slate-300 p-2" placeholder="Write a project message…" />
                  <button type="submit" className="rounded-md bg-[#0F172A] px-4 py-2 font-semibold text-white">Send</button>
                </form>
              </section>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
