"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/project-delivery";

type CvDocument = {
  id: string;
  title: string;
  createdAt: string;
  previewUrl: string;
  downloadUrl: string;
};

export default function CvLibraryPage() {
  const [documents, setDocuments] = useState<CvDocument[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadDocuments = useCallback(async () => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      setError("Sign in to view your saved CVs.");
      setLoading(false);
      return;
    }
    setError("");
    try {
      const result = await apiRequest<CvDocument[]>("/cv-documents", token);
      setDocuments(result);
      setSelectedId((current) => result.some((document) => document.id === current) ? current : result[0]?.id ?? "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load your CV library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadDocuments(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDocuments]);

  const selectedDocument = documents.find((document) => document.id === selectedId);

  // FIX: Fetch PDF as blob with Authorization header
  useEffect(() => {
    if (!selectedDocument?.id) {
      setPdfBlobUrl("");
      return;
    }
    const fetchPdf = async () => {
      setPdfLoading(true);
      try {
        const token = sessionStorage.getItem("accessToken") || "";
        const res = await fetch(`/api/cv-documents/file/${selectedDocument.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt);
        }
        const blob = await res.blob();
        if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      } finally {
        setPdfLoading(false);
      }
    };
    fetchPdf();
    return () => {
      // cleanup not here to keep url alive
    };
  }, [selectedDocument?.id]);

  const handleDownload = async () => {
    if (!selectedDocument) return;
    const token = sessionStorage.getItem("accessToken") || "";
    const res = await fetch(`/api/cv-documents/file/${selectedDocument.id}?download=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const txt = await res.text();
      alert(txt);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedDocument.title}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Client portal</p>
          <h1 className="mt-2 text-4xl font-bold">My CV library</h1>
          <p className="mt-3 text-slate-600">Your CV text and private PDF files, saved to your account.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/ai-tools/cv-builder" className="rounded-md bg-[#0F172A] px-4 py-2 font-semibold text-white">Create a CV</Link>
          <button type="button" onClick={() => { setLoading(true); void loadDocuments(); }} className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Refresh</button>
        </div>
      </div>

      {error && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {loading ? <p role="status" className="mt-8">Loading your CVs…</p> : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(250px,0.75fr)_minmax(0,1.5fr)]">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold">Saved CVs ({documents.length})</h2>
            {documents.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">You have not generated a CV yet. Create one to see it here.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {documents.map((document) => (
                  <li key={document.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(document.id)}
                      className={`w-full rounded-lg border p-3 text-left ${selectedId === document.id ? "border-[#D4AF37] bg-[#FFFBEB]" : "border-slate-200"}`}
                    >
                      <span className="block font-semibold">{document.title}</span>
                      <span className="mt-1 block text-xs text-slate-500">{new Date(document.createdAt).toLocaleString()}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            {selectedDocument ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-bold">{selectedDocument.title}</h2>
                  <button onClick={handleDownload} className="rounded-md bg-[#0F172A] px-4 py-2 font-semibold text-white">Download PDF</button>
                </div>
                {pdfLoading ? <p>Loading PDF…</p> : pdfBlobUrl ? (
                  <iframe title={`PDF preview: ${selectedDocument.title}`} src={pdfBlobUrl} className="h-[720px] w-full rounded border border-slate-200" />
                ) : <p className="text-slate-600">PDF preview unavailable.</p>}
              </>
            ) : <p className="text-slate-600">Select a saved CV to preview it.</p>}
          </section>
        </div>
      )}
    </main>
  );
}