"use client";
import { useState } from "react";
export default function QuoteRequestForm() {
  const [sent, setSent] = useState(false);
  return (
    <form onSubmit={(e)=>{e.preventDefault(); setSent(true)}} className="space-y-4 p-6 border rounded-xl">
      <input required placeholder="Name" className="w-full p-3 border rounded" />
      <input required placeholder="Email" className="w-full p-3 border rounded" />
      <textarea required placeholder="Message" className="w-full p-3 border rounded h-32" />
      <button className="w-full bg-black text-white p-3 rounded">{sent ? "Sent!" : "Send Request"}</button>
    </form>
  );
}
