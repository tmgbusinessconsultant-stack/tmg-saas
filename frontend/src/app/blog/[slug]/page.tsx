"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
export default function BlogSlugPage(){
  const params=useParams();
  const [post,setPost]=useState<any>(null);
  useEffect(()=>{
    const url = (process.env.NEXT_PUBLIC_API_URL||"http://localhost:4000") + "/api/blog/" + params.slug;
    fetch(url).then(r=>r.json()).then(d=>setPost(d.data||d)).catch(()=>{});
  },[params.slug]);
  if(!post) return <div className="p-10">Loading...</div>;
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/blog" className="text-sm">← Blog</Link>
      <h1 className="text-3xl font-bold mt-2">{post.title}</h1>
      <div className="mt-6" dangerouslySetInnerHTML={{__html: post.content||"No content"}} />
    </div>
  );
}