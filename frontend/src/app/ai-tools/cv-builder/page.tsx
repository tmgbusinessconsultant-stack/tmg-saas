"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CvBuilderPage(){
  const [step,setStep]=useState(1);
  const [data,setData]=useState({name:"",role:"",experience:"",skills:""});
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState("");
  const [token,setToken]=useState("");

  useEffect(()=>{
    setToken(sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || localStorage.getItem("token") || "");
  },[]);

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "http://localhost:4000";
  };

  const generate=async()=>{
    if(!token){ setResult("Please login first - no token"); return; }
    if(!data.name || !data.role){ setResult("Name and Role required"); return; }
    setLoading(true);
    setResult("");
    try{
      // Try real CV documents endpoint
      const apiUrl = getApiUrl();
      const res=await fetch(`${apiUrl}/cv-documents`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        },
        body:JSON.stringify({
          name: data.name,
          role: data.role,
          contact: { fullName: data.name, title: data.role },
          exps: [{ title: data.role, company: "", bullets: data.experience }],
          skills: data.skills,
          summary: data.experience,
          template: "Qatar Professional"
        })
      });
      const j=await res.json(); 
      if(!res.ok) throw new Error(j.message || `Failed ${res.status}`);
      setResult(JSON.stringify(j, null, 2));
      setStep(3);
    }catch(e:any){ 
      // Fallback to AI endpoint
      try {
        const apiUrl = getApiUrl();
        const res2 = await fetch(`${apiUrl}/ai/cv-builder`,{
          method:"POST",
          headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
          body:JSON.stringify(data)
        });
        const j2=await res2.json();
        setResult(j2.data||j2.result||JSON.stringify(j2, null, 2));
        setStep(3);
      } catch {
        setResult(`Error: ${e.message} - Check backend running at ${getApiUrl()}`);
      }
    } 
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/ai-tools" className="text-sm text-zinc-500 hover:text-black">← AI Tools</Link>
      <h1 className="text-3xl font-bold mt-2 tracking-tight">CV Builder - Advanced</h1>
      <p className="text-sm text-zinc-500 mt-1">Token: {token ? "✓ Connected" : "✗ Not logged in"}</p>
      <div className="mt-6 space-y-4">
        {step===1 && (
          <div className="space-y-3 rounded-[20px] border bg-white p-6 shadow-sm">
            <input value={data.name} onChange={e=>setData({...data,name:e.target.value})} placeholder="Full Name *" className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-[12px] text-sm focus:outline-none focus:border-black"/>
            <input value={data.role} onChange={e=>setData({...data,role:e.target.value})} placeholder="Target Role *" className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-[12px] text-sm focus:outline-none focus:border-black"/>
            <button onClick={()=>setStep(2)} className="bg-zinc-900 hover:bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold">Next — Experience</button>
          </div>
        )}
        {step===2 && (
          <div className="space-y-3 rounded-[20px] border bg-white p-6 shadow-sm">
            <textarea value={data.experience} onChange={e=>setData({...data,experience:e.target.value})} placeholder="Experience (achievements)" className="w-full border border-zinc-200 p-3 rounded-[12px] h-32 text-sm bg-zinc-50 focus:bg-white focus:outline-none"/>
            <textarea value={data.skills} onChange={e=>setData({...data,skills:e.target.value})} placeholder="Skills (comma separated)" className="w-full border border-zinc-200 p-3 rounded-[12px] h-20 text-sm bg-zinc-50 focus:bg-white focus:outline-none"/>
            <div className="flex gap-2">
              <button onClick={()=>setStep(1)} className="border border-zinc-200 px-6 py-2.5 rounded-full text-sm">Back</button>
              <button onClick={generate} className="bg-zinc-900 hover:bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold">Generate CV</button>
            </div>
          </div>
        )}
        {step===3 && (
          <div className="rounded-[20px] border bg-white p-6 shadow-sm">
            <h2 className="font-bold">Result</h2>
            {loading ? <p className="mt-3 text-sm">Generating...</p> : <div className="mt-3 p-4 border border-zinc-100 rounded-[12px] whitespace-pre-wrap bg-zinc-50 text-sm max-h-[400px] overflow-auto">{result}</div>}
            <div className="mt-4 flex gap-2">
              <button onClick={()=>setStep(2)} className="border border-zinc-200 px-4 py-2 rounded-full text-sm">Edit</button>
              <Link href="/cv-documents" className="border border-zinc-200 px-4 py-2 rounded-full text-sm bg-white">View All CVs</Link>
              <Link href="/ai-tools/cv-builder" className="bg-zinc-900 text-white px-4 py-2 rounded-full text-sm">Go to Pro Builder</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}