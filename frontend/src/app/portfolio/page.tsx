"use client";
import Link from "next/link";
export default function PortfolioPage(){
  const items=[{title:"Projects",href:"/projects"},{title:"CV Documents",href:"/cv-documents"},{title:"Business Plans",href:"/business-plans"},{title:"AI Tools",href:"/ai-tools"}];
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Portfolio - All Work</h1>
      <p className="text-gray-500 mt-1">Connected to all document hubs</p>
      <div className="grid md:grid-cols-2 gap-4 mt-8">{items.map(i=><Link key={i.href} href={i.href} className="p-6 border rounded-xl hover:bg-black hover:text-white"><h3 className="font-bold text-lg">{i.title}</h3><p className="text-sm mt-1 opacity-70">View {i.title}</p></Link>)}</div>
    </div>
  );
}

