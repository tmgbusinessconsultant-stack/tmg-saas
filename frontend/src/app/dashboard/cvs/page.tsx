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
    const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    if (!token) {
      setError("Sign in to view your saved CVs.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest<CvDocument[]>("/cv-documents", token);
      setDocuments(result);
      setSelectedId((curr) => result.some(d => d.id === curr) ? curr : result[0]?.id ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your CV library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDocuments(); }, [loadDocuments]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => { if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl); };
  }, [pdfBlobUrl]);

  const selectedDocument = documents.find(d => d.id === selectedId);

  useEffect(() => {
    if (!selectedDocument?.id) { setPdfBlobUrl(""); return; }
    let active = true;
    const fetchPdf = async () => {
      setPdfLoading(true);
      setError("");
      try {
        const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || "";
        const res = await fetch(`/api/cv-documents/file/${selectedDocument.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        if (!active) return;
        if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(URL.createObjectURL(blob));
      } catch (e: any) {
        if (active) setError(e.message);
      } finally {
        if (active) setPdfLoading(false);
      }
    };
    void fetchPdf();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocument?.id]);

  const handleDownload = async () => {
    if (!selectedDocument) return;
    try {
      const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || "";
      const res = await fetch(`/api/cv-documents/file/${selectedDocument.id}?download=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedDocument.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        {/* Header - TMG Standard */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Client portal</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900">My CV library</h1>
            <p className="mt-3 text-zinc-500">Your CV text and private PDF files, saved to your account.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/ai-tools/cv-builder" className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black transition-colors">Create a CV</Link>
            <button type="button" onClick={() => void loadDocuments()} className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors">Refresh</button>
          </div>
        </div>

        {error && <div role="alert" className="mt-6 rounded-[16px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

        {loading ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.5fr]">
            <div className="rounded-[24px] border border-zinc-200 bg-white p-5 h-[300px] animate-pulse bg-zinc-100" />
            <div className="rounded-[24px] border border-zinc-200 bg-white p-5 h-[720px] animate-pulse bg-zinc-100" />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
            <section className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] self-start">
              <h2 className="text-base font-semibold text-zinc-900">Saved CVs ({documents.length})</h2>
              {documents.length === 0 ? (
                <div className="mt-6 text-center py-10 border border-dashed border-zinc-200 rounded-[16px]">
                  <p className="text-sm text-zinc-500">You have not generated a CV yet.</p>
                  <Link href="/ai-tools/cv-builder" className="mt-3 inline-block text-sm font-semibold text-zinc-900 underline decoration-[#D4AF37] underline-offset-4">Create first CV</Link>
                </div>
              ) : (
                <ul className="mt-5 space-y-2.5">
                  {documents.map((doc) => (
                    <li key={doc.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(doc.id)}
                        className={`w-full rounded-[14px] border p-3.5 text-left transition-all ${selectedId === doc.id ? "border-[#D4AF37] bg-[#FFFBEB] shadow-sm" : "border-zinc-200 hover:border-zinc-300 bg-white"}`}
                      >
                        <span className="block text-[14px] font-semibold text-zinc-900 truncate">{doc.title}</span>
                        <span className="mt-1 block text-xs text-zinc-500">{new Date(doc.createdAt).toLocaleString()}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              {selectedDocument ? (
                <>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold text-zinc-900">{selectedDocument.title}</h2>
                    <button onClick={handleDownload} className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black transition-colors">Download PDF</button>
                  </div>
                  <div className="rounded-[16px] overflow-hidden border border-zinc-200 bg-zinc-50">
                    {pdfLoading ? (
                      <div className="h-[720px] grid place-items-center text-sm text-zinc-500">Loading PDF…</div>
                    ) : pdfBlobUrl ? (
                      <iframe title={`PDF preview: ${selectedDocument.title}`} src={pdfBlobUrl} className="h-[720px] w-full bg-white" />
                    ) : <div className="h-[200px] grid place-items-center text-sm text-zinc-500">PDF preview unavailable.</div>}
                  </div>
                </>
              ) : <div className="py-20 text-center text-sm text-zinc-500">Select a saved CV to preview it.</div>}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
