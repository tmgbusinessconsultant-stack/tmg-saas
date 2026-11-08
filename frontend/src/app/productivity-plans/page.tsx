"use client";
import { useEffect, useState } from "react";
import { API_URL, getToken } from "@/lib/api";
import Link from "next/link";

type PlanRecord = { id?: string; title?: string; name?: string; createdAt?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPlanRecord(value: unknown): value is PlanRecord {
  return isRecord(value) &&
    (value.id === undefined || typeof value.id === "string") &&
    (value.title === undefined || typeof value.title === "string") &&
    (value.name === undefined || typeof value.name === "string") &&
    (value.createdAt === undefined || typeof value.createdAt === "string");
}

export default function Page() {
  const [data, setData] = useState<PlanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken() || localStorage.getItem('accessToken') || '';
    fetch(`${API_URL}/productivity-plans`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    })
      .then((r) => r.json())
      .then((j) => {
        const arr = Array.isArray(j) ? j : isRecord(j) && Array.isArray(j.data) ? j.data : isRecord(j) && Array.isArray(j.documents) ? j.documents : [];
        setData(arr.filter(isPlanRecord));
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black">Productivity Plans</h1>
      <p className="text-sm text-slate-500">
        {loading ? "Loading your saved plans…" : `${data.length} saved plans`}
      </p>

      {loading ? (
        <div className="mt-6 border-2 border-dashed rounded-2xl p-12 text-center animate-pulse">
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="mt-6 border-2 border-dashed rounded-2xl p-12 text-center bg-white">
          <p className="text-3xl">⚡</p>
          <p className="font-black mt-2">No productivity plans yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Create a productivity plan with the planner and it will appear here.
          </p>
          <Link
            href="/ai-tools/productivity-planner"
            className="mt-4 inline-block px-5 py-2 bg-black text-white rounded-xl font-bold text-sm"
          >
            + Create Productivity Plan →
          </Link>
          <p className="mt-4 text-[11px] text-slate-400">
            Plans created with your account appear in this library.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-2">
          {data.map((d, i) => (
            <div key={d.id || i} className="border p-3 rounded-xl bg-white">
              <b className="text-sm">{d.title || d.name || `Plan ${i + 1}`}</b>
              {d.createdAt && <p className="mt-1 text-xs text-slate-500">Created {new Date(d.createdAt).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}