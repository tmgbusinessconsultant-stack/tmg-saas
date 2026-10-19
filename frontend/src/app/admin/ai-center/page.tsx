"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/project-delivery";

type KnowledgeDocument = {
  id: string;
  fileName: string;
  contentType: string;
  status: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  message: string;
  response: string;
  createdAt: string;
  sessionId: string;
};

type AiData = {
  totalConversations: number;
  activeSessions: number;
  popularQuestions: Array<{ question: string; count: number }>;
  conversations: Conversation[];
};

export default function AiCenterPage() {
  const [token, setToken] = useState("");
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [data, setData] = useState<AiData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (accessToken: string) => {
    const [knowledge, conversations] = await Promise.all([
      apiRequest<KnowledgeDocument[]>("/ai/admin/knowledge", accessToken),
      apiRequest<AiData>("/ai/admin/conversations", accessToken),
    ]);
    setDocuments(knowledge);
    setData(conversations);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const accessToken = sessionStorage.getItem("accessToken") ?? "";
      setToken(accessToken);
      if (!accessToken) {
        setLoading(false);
        return;
      }
      void load(accessToken)
        .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load AI Center data."))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!file || !token) return;
    setBusy("upload");
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.set("file", file);
      await apiRequest<KnowledgeDocument>("/ai/admin/knowledge", token, { method: "POST", body: form });
      setFile(null);
      formElement.reset();
      setNotice("File uploaded into quarantine. Refresh its scan status before it can be indexed.");
      await load(token);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not upload knowledge file.");
    } finally {
      setBusy("");
    }
  }

  async function refreshScan(id: string) {
    setBusy(id);
    setError("");
    try {
      const result = await apiRequest<{ status: string }>(`/ai/admin/knowledge/${encodeURIComponent(id)}/scan`, token, { method: "POST" });
      setNotice(result.status === "INDEXED" ? "Clean file scanned and indexed." : `Current file status: ${result.status}.`);
      await load(token);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not refresh scan status.");
    } finally {
      setBusy("");
    }
  }

  async function deleteDocument(id: string) {
    if (!window.confirm("Delete this knowledge document and remove it from AI search?")) return;
    setBusy(id);
    setError("");
    try {
      await apiRequest(`/ai/admin/knowledge/${encodeURIComponent(id)}`, token, { method: "DELETE" });
      await load(token);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not delete knowledge document.");
    } finally {
      setBusy("");
    }
  }

  async function deleteConversation(id: string) {
    if (!window.confirm("Permanently delete this conversation record?")) return;
    setBusy(id);
    setError("");
    try {
      await apiRequest(`/ai/admin/conversations/${encodeURIComponent(id)}`, token, { method: "DELETE" });
      await load(token);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not delete conversation.");
    } finally {
      setBusy("");
    }
  }

  if (loading) return <main className="mx-auto max-w-7xl px-6 py-12" role="status">Loading AI Center…</main>;
  if (!token) return <main className="mx-auto max-w-2xl px-6 py-16"><h1 className="text-3xl font-bold">Admin sign-in required</h1><Link href="/login" className="mt-5 inline-block underline">Sign in</Link></main>;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Admin</p><h1 className="mt-2 text-4xl font-bold">AI Center</h1><p className="mt-2 text-slate-600">Manage approved knowledge files and review AI conversations. Do not upload confidential or personal data.</p></div>
        <Link href="/admin" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Back to dashboard</Link>
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">AI questions stored (90 days)</p><p className="mt-2 text-3xl font-bold">{data?.totalConversations ?? 0}</p></div>
        <div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Distinct anonymous sessions</p><p className="mt-2 text-3xl font-bold">{data?.activeSessions ?? 0}</p></div>
      </section>
      <section className="mt-8 rounded-xl border bg-white p-5">
        <h2 className="text-2xl font-bold">Knowledge base</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">PDF, DOCX, XLSX, CSV and TXT up to 10 MB. Files are held in private S3 until the configured malware scanner reports clean; only then is text extracted and indexed.</p>
        <form onSubmit={upload} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="file" accept=".pdf,.docx,.xlsx,.csv,.txt" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="min-w-0 flex-1 rounded border p-2" />
          <button type="submit" disabled={!file || busy === "upload"} className="rounded bg-[#0F172A] px-4 py-2 font-semibold text-white disabled:opacity-50">{busy === "upload" ? "Uploading…" : "Upload knowledge file"}</button>
        </form>
        <ul className="mt-5 divide-y">
          {documents.map((document) => (
            <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div><p className="font-semibold">{document.fileName}</p><p className="text-xs text-slate-500">{document.status} · {new Date(document.createdAt).toLocaleString()}</p></div>
              <div className="flex gap-2">
                {document.status === "SCANNING" && <button type="button" disabled={busy === document.id} onClick={() => { void refreshScan(document.id); }} className="rounded border px-3 py-2 text-sm font-semibold">Refresh scan</button>}
                <button type="button" disabled={busy === document.id} onClick={() => { void deleteDocument(document.id); }} className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Delete</button>
              </div>
            </li>
          ))}
          {documents.length === 0 && <li className="py-5 text-sm text-slate-500">No knowledge files yet.</li>}
        </ul>
      </section>
      <section className="mt-8 rounded-xl border bg-white p-5">
        <h2 className="text-2xl font-bold">Popular questions</h2>
        <ul className="mt-3 space-y-2">{data?.popularQuestions.map((item) => <li key={item.question} className="flex justify-between gap-4 border-b py-2"><span>{item.question}</span><span className="font-semibold">{item.count}</span></li>)}</ul>
      </section>
      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-bold">Recent conversations (90-day retention)</h2>
        {data?.conversations.map((conversation) => (
          <article key={conversation.id} className="rounded-xl border bg-white p-5">
            <div className="flex flex-wrap justify-between gap-3"><p className="text-xs text-slate-500">{new Date(conversation.createdAt).toLocaleString()} · anonymous session</p><button type="button" disabled={busy === conversation.id} onClick={() => { void deleteConversation(conversation.id); }} className="text-sm font-semibold text-red-700 underline">Delete chat</button></div>
            <h3 className="mt-3 font-bold">Question</h3><p className="mt-1 whitespace-pre-wrap text-sm">{conversation.message}</p>
            <h3 className="mt-3 font-bold">Response</h3><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{conversation.response}</p>
          </article>
        ))}
        {!data?.conversations.length && <p className="rounded-lg border border-dashed p-6 text-slate-500">No conversations are stored yet.</p>}
      </section>
    </main>
  );
}
