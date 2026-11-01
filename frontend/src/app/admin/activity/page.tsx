"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/project-delivery";

type ActivityItem = {
  id: string;
  action: string;
  targetId: string | null;
  detail: unknown;
  createdAt: string;
  actor: { id: string; name: string; email: string };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isActivityItem(value: unknown): value is ActivityItem {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.action === "string"
    && (typeof value.targetId === "string" || value.targetId === null)
    && typeof value.createdAt === "string"
    && isRecord(value.actor)
    && typeof value.actor.id === "string"
    && typeof value.actor.name === "string"
    && typeof value.actor.email === "string";
}

export default function AdminActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
      if (!token) {
        setError("Sign in with the Super Admin account to view the activity log.");
        return;
      }
      void apiRequest<unknown>("/admin/activity", token)
        .then((response) => {
          const list = Array.isArray(response)
            ? response
            : isRecord(response)
              ? response.data ?? response.items ?? response.activity
              : null;
          if (!Array.isArray(list) || !list.every(isActivityItem)) {
            throw new Error("The activity API returned an invalid response.");
          }
          setItems(list);
        })
        .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load activity."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Super Admin</p>
      <h1 className="mt-2 text-4xl font-bold">Activity log</h1>
      <p className="mt-3 text-slate-600">Recent user access and website content changes.</p>
      {error && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-slate-50"><tr><th className="p-3">Date and time</th><th className="p-3">Actor</th><th className="p-3">Action</th><th className="p-3">Details</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-200">
                <td className="p-3">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</td>
                <td className="p-3">{item.actor?.name || "Unknown"}<span className="block text-xs text-slate-500">{item.actor?.email || ""}</span></td>
                <td className="p-3">{item.action}</td>
                <td className="p-3"><code className="whitespace-pre-wrap break-all text-xs">{item.targetId ? `${item.targetId}: ` : ""}{JSON.stringify(item.detail)?.slice(0,300)}</code></td>
              </tr>
            ))}
            {items.length === 0 && !error && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No activity recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
