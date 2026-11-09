"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import Link from "next/link";

type ProjectSummary = { id: string; title?: string; name?: string };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  useEffect(()=>{ fetch(`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/, "")}/projects`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}}).then(r=>r.json()).then(d=>setProjects(d.data||[])).catch(()=>{}); },[]);
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center"><h1 className="text-3xl font-bold">Projects</h1><Link href="/upload" className="bg-black text-white px-4 py-2 rounded">New Project</Link></div>
      <p className="text-gray-500 mt-2">Track project progress and manage your shared files.</p>
      <div className="grid md:grid-cols-3 gap-4 mt-6">{projects.length===0 ? <div className="col-span-3 p-10 border-2 border-dashed rounded-xl text-center">No projects yet. <Link href="/upload" className="text-blue-600 underline">Upload first</Link></div> : projects.map(p=><Link key={p.id} href={`/projects/${encodeURIComponent(p.id)}`} className="p-5 border rounded-xl hover:shadow">{p.title||p.name}</Link>)}</div>
    </div>
  );
}


