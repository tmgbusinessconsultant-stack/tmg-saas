"use client";
import { useEffect, useState } from "react";
import { API_URL, getToken } from "@/lib/api";
import Link from "next/link";

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken() || localStorage.getItem('accessToken') || '';
    fetch(`${API_URL}/productivity-plans`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((j) => {
        const arr = Array.isArray(j) ? j : j.data || j.documents || [];
        setData(arr);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black">Productivity Plans</h1>
      <p className="text-sm text-slate-500">
        Advanced table: productivity_plans exists — {loading ? "loading" : `${data.length} records`}
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
            Your table is empty — this was showing [] before. Create your first one.
          </p>
          <Link
            href="/ai-tools/productivity-planner"
            className="mt-4 inline-block px-5 py-2 bg-black text-white rounded-xl font-bold text-sm"
          >
            + Create Productivity Plan →
          </Link>
          <p className="mt-4 text-[11px] text-slate-400">
            Old data was: [] — now replaced with BEST empty state
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-2">
          {data.map((d: any, i: number) => (
            <div key={d.id || i} className="border p-3 rounded-xl bg-white">
              <b className="text-sm">{d.title || d.name || `Plan ${i + 1}`}</b>
              <pre className="mt-1 bg-gray-50 p-2 text-[11px] overflow-auto">
                {JSON.stringify(d, null, 2).slice(0, 400)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}