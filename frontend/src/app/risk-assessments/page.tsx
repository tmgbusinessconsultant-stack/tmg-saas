"use client";
import { useEffect, useState } from "react";
import { API_URL, getToken } from "@/lib/api";
import Link from "next/link";

type RiskRecord = { id?: string; businessType?: string; industry?: string; createdAt?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRiskRecord(value: unknown): value is RiskRecord {
  return isRecord(value) &&
    (value.id === undefined || typeof value.id === "string") &&
    (value.businessType === undefined || typeof value.businessType === "string") &&
    (value.industry === undefined || typeof value.industry === "string") &&
    (value.createdAt === undefined || typeof value.createdAt === "string");
}

export default function Page(){
  const [data,setData]=useState<RiskRecord[]>([]);
  const [loading,setLoading]=useState(true);
  
  useEffect(()=>{
    const token = getToken() || localStorage.getItem('accessToken') || '';
    fetch(`${API_URL}/risk-assessments`,{
      headers:{Authorization: `Bearer ${token}` },
      cache:"no-store"
    }).then(r=>r.json()).then(j=>{
      const arr = Array.isArray(j) ? j : isRecord(j) && Array.isArray(j.data) ? j.data : [];
      setData(arr.filter(isRiskRecord));
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black">Risk Assessments</h1>
      <p className="text-sm text-slate-500">{loading ? "Loading your assessments…" : `${data.length} saved assessments`}</p>
      
      {loading ? (
        <div className="mt-6 border-2 border-dashed rounded-2xl p-12 text-center animate-pulse">Loading...</div>
      ) : data.length===0 ? (
        <div className="mt-6 border-2 border-dashed rounded-2xl p-12 text-center bg-white">
          <p className="text-3xl">🛡️</p>
          <p className="font-black mt-2">No risk assessments yet</p>
          <p className="text-sm text-slate-500 mt-1">Create a risk assessment to see it in this library.</p>
          <Link href="/ai-tools/risk-assessment" className="mt-4 inline-block px-5 py-2 bg-black text-white rounded-xl font-bold text-sm">+ Create Risk Assessment →</Link>
          <p className="mt-4 text-[11px] text-slate-400">Assessments created with your account appear here.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-2">
          {data.map((d,i)=>(
            <div key={d.id||i} className="border p-3 rounded-xl bg-white">
              <b className="text-sm">{d.businessType||d.industry||`Risk ${i+1}`}</b>
              {d.createdAt && <p className="mt-1 text-xs text-slate-500">Created {new Date(d.createdAt).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
