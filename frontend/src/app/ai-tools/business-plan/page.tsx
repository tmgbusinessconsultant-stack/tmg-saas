"use client";
import { useState } from "react";
import Link from "next/link";
export default function BusinessPlanPage() {
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState("");
  const [idea,setIdea]=useState("");
  const generate=async()=>{
    setLoading(true);
    try{
      const res=await fetch(`${process.env.NEXT_PUBLIC_API_URL||"http://localhost:4000"}/api/ai/business-plan`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")}`},body:JSON.stringify({idea})});
      const data=await res.json(); setResult(data.data||data.result||JSON.stringify(data));
    }catch(e){ setResult("Error generating - check backend on 4000"); } setLoading(false);
  };
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/ai-tools" className="text-sm text-gray-500">← All AI Tools</Link>
      <h1 className="text-3xl font-bold mt-2">Business Plan Generator - Advanced</h1>
      <p className="text-gray-500">Connected to /api/ai/business-plan + Documents Hub</p>
      <div className="mt-6"><textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Describe your business idea..." className="w-full border p-4 rounded-xl h-32"/><button onClick={generate} disabled={loading||!idea} className="mt-3 bg-black text-white px-6 py-3 rounded-xl disabled:opacity-50">{loading?"Generating...":"Generate Advanced Plan"}</button></div>
      {result && <div className="mt-6 p-6 border rounded-xl whitespace-pre-wrap bg-gray-50">{result}</div>}
      <div className="mt-6 flex gap-3"><Link href="/business-plans" className="border px-4 py-2 rounded">View All Plans</Link><Link href="/documents" className="border px-4 py-2 rounded">Documents Hub</Link></div>
    </div>
  );
}
