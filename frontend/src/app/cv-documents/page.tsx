"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function CvDocumentsPage(){
  const [docs,setDocs]=useState([]);
  useEffect(()=>{ fetch(`${process.env.NEXT_PUBLIC_API_URL||"http://localhost:4000"}/api/cv-documents`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}}).then(r=>r.json()).then(d=>setDocs(d.data||d||[])).catch(()=>{}); },[]);
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between"><h1 className="text-3xl font-bold">CV Documents</h1><Link href="/ai-tools/cv-builder" className="bg-black text-white px-4 py-2 rounded">Create CV</Link></div>
      <div className="grid gap-3 mt-6">{docs.length===0 ? <div className="p-10 border-2 border-dashed rounded text-center">No CVs. <Link href="/ai-tools/cv-builder" className="text-blue-600">Build one</Link></div> : docs.map((d:any)=><div key={d.id} className="p-4 border rounded flex justify-between"><span>{d.title||d.name}</span><Link href={`/cv-documents/${d.id}`} className="text-blue-600">View</Link></div>)}</div>
    </div>
  );
}

