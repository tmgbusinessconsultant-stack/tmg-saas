"use client";
import Link from "next/link";
export default function DocumentsHub(){
  const items=[{href:"/projects",title:"Projects",desc:"Local uploads preferred"},{href:"/cv-documents",title:"CV Documents",desc:"All CVs"},{href:"/business-plans",title:"Business Plans",desc:"AI Plans"},{href:"/productivity-plans",title:"Productivity Plans",desc:"Plans"},{href:"/risk-assessments",title:"Risk Assessments",desc:"Assessments"}];
  const tools=["cv-builder","cover-letter","business-plan","business-assistant","business-contracts","policy-generator","sop-builder","proposal-packs","risk-assessment","document-review","productivity-planner"];
  return (
    <div className="p-6 max-w-5xl mx-auto"><h1 className="text-3xl font-bold">Documents Hub - Everything Connected</h1><div className="grid md:grid-cols-3 gap-4 mt-6">{items.map(i=><Link key={i.href} href={i.href} className="p-5 border rounded-xl hover:bg-black hover:text-white"><b>{i.title}</b><p className="text-sm opacity-70">{i.desc}</p></Link>)}</div><h2 className="mt-10 font-bold">AI Tools</h2><div className="grid md:grid-cols-3 gap-2 mt-3">{tools.map(t=><Link key={t} href={`/ai-tools/${t}`} className="p-3 border rounded text-sm hover:bg-gray-900 hover:text-white">{t}</Link>)}</div></div>
  );
}
