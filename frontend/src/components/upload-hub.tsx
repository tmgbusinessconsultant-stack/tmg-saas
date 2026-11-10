"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest, uploadProjectFile, type Project } from "@/lib/project-delivery";

const ADMIN_EMAIL = "info@tmgbusinessconsulting.com";
const TIKTOK_PROFILE = "https://www.tiktok.com/@tmgbusinessconsultant";
const uploadAccept = ".docx,.doc,.pdf,.xlsx,.xls,.csv,.pptx,.txt,.json,.xml,.zip,.png,.jpg,.jpeg,.webp";

function getToken() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || localStorage.getItem("token") || "";
}

export function UploadHubClient({ showSignInPrompt = true }: { showSignInPrompt?: boolean }) {
  const [token] = useState(getToken);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [projectId, setProjectId] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoType, setVideoType] = useState<"YOUTUBE" | "TIKTOK">("YOUTUBE");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoBusy, setVideoBusy] = useState(false);

  const load = useCallback(async (t: string) => {
    const data = await apiRequest<Project[]>("/projects", t);
    setProjects(data);
    setProjectId((cur) => cur || data[0]?.id || "");
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const run = async () => {
      try {
        await load(token);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Could not load projects.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => { active = false; };
  }, [load, token]);

  const selectedProject = useMemo(() => projects.find((p) => p.id === projectId) || null, [projects, projectId]);

  async function doUpload(file: File) {
    if (!token || !projectId) { setError("Select a project first."); return; }
    if (file.size > 100 * 1024 * 1024) { setError("File must not exceed 100 MB."); return; }
    setUploading(true); setError(""); setNotice(""); setProgress(0);
    try {
      await uploadProjectFile(projectId, file, token, "CLIENT_UPLOAD", setProgress);
      await load(token);
      setNotice(`${file.name} uploaded. It is scanned (PENDING → CLEAN/INFECTED) and only CLEAN files can be downloaded/served.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function addVideo() {
    if (!token || !projectId) { setError("Select a project first."); return; }
    if (!videoUrl.trim()) { setError("Enter a YouTube or TikTok link."); return; }
    setVideoBusy(true); setError(""); setNotice("");
    try {
      await apiRequest(`/projects/${encodeURIComponent(projectId)}/video-links`, token, {
        method: "POST",
        body: JSON.stringify({ url: videoUrl.trim(), type: videoType, title: videoTitle.trim() || undefined }),
      });
      setVideoUrl(""); setVideoTitle("");
      await load(token);
      setNotice("Video link saved to the project (no video file stored).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save video link.");
    } finally {
      setVideoBusy(false);
    }
  }

  if (loading) return <div className="py-12 text-slate-500">Loading upload hub…</div>;
  if (!token) {
    return (
      <div className="rounded-2xl border bg-white p-8">
        <h2 className="text-xl font-semibold">Sign in required</h2>
        <p className="mt-2 text-slate-600">Sign in to upload files or add video links to your project.</p>
        {showSignInPrompt && <Link href="/login?next=%2Fdashboard%2Fupload" className="mt-4 inline-block rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white">Sign in</Link>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {(error || notice) && (
        <p role={error ? "alert" : "status"} className={`rounded-lg border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || notice}</p>
      )}

      <section className="rounded-2xl border bg-white p-6">
        <label className="block text-sm font-medium">Project
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-2 w-full max-w-xl rounded-lg border p-2.5">
            <option value="">Select a project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.id.slice(0, 8)}…)</option>)}
          </select>
        </label>
        {selectedProject && <p className="mt-2 text-xs text-slate-500">Project ID: <code className="rounded bg-slate-100 px-1">{selectedProject.id}</code> — include this ID in email subjects for manual linking.</p>}
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Option A — Upload in project (recommended)</h2>
        <p className="mt-2 text-sm text-slate-600">Word, Excel, PDF, images and supported docs up to <strong>100 MB</strong>. Saved to <strong>local disk</strong> (private server folder), scanned with <strong>ClamAV</strong> (status: PENDING → CLEAN/INFECTED). Files are served only if <strong>CLEAN</strong> via authenticated backend download.</p>
        <input
          type="file"
          accept={uploadAccept}
          disabled={!projectId || uploading}
          className="mt-4 block w-full max-w-xl rounded-lg border p-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white"
          onChange={(e) => { const f = e.currentTarget.files?.[0]; e.currentTarget.value = ""; if (f) void doUpload(f); }}
        />
        {uploading && <p className="mt-2 text-sm text-slate-600">Uploading/scanning… {progress}%</p>}
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Option B — Upload via email (manual)</h2>
        <p className="mt-2 text-sm text-slate-600">Email your file to <a href={`mailto:${ADMIN_EMAIL}`} className="font-semibold underline">{ADMIN_EMAIL}</a> and include your <strong>Project ID</strong> in the subject (example: <code className="rounded bg-slate-100 px-1">Project {projectId || "PROJECT_ID"} - your file</code>).</p>
        <p className="mt-2 text-sm text-slate-600">Gmail is the admin inbox. Emails are received there; <strong>admin will manually link</strong> the emailed file to your project. Automatic Gmail reading/import is not enabled.</p>
        <p className="mt-2 text-xs text-slate-500">Security note: do not email highly sensitive data if avoidable; prefer Option A (scanned, access-controlled project upload).</p>
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Option C — Big video via link (no video storage)</h2>
        <p className="mt-2 text-sm text-slate-600">Paste a <strong>YouTube</strong> or <strong>TikTok</strong> link. The link is saved in the database and shown in the project (embedded player). No video file is uploaded or stored. Example TikTok profile: <a href={TIKTOK_PROFILE} target="_blank" rel="noopener noreferrer" className="underline">{TIKTOK_PROFILE}</a></p>
        <div className="mt-4 grid gap-3 max-w-xl">
          <label className="text-sm font-medium">Platform
            <select value={videoType} onChange={(e) => setVideoType(e.target.value as "YOUTUBE" | "TIKTOK")} className="mt-1 w-full rounded-lg border p-2.5">
              <option value="YOUTUBE">YouTube</option>
              <option value="TIKTOK">TikTok</option>
            </select>
          </label>
          <label className="text-sm font-medium">Video URL
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder={videoType === "YOUTUBE" ? "https://www.youtube.com/watch?v=..." : "https://www.tiktok.com/@tmgbusinessconsultant/video/..."} className="mt-1 w-full rounded-lg border p-2.5" />
          </label>
          <label className="text-sm font-medium">Title (optional)
            <input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Short label" className="mt-1 w-full rounded-lg border p-2.5" />
          </label>
          <button type="button" disabled={!projectId || videoBusy} onClick={() => void addVideo()} className="justify-self-start rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{videoBusy ? "Saving…" : "Save video link"}</button>
        </div>
      </section>

      <p className="text-xs text-slate-500">Uploads are scanned (PENDING/CLEAN/INFECTED) and only CLEAN files are served. Admins download originals, edit in Adobe locally, then upload an edited version as a Deliverable (Original → Edited → Delivered).</p>
    </div>
  );
}
