"use client";
import Link from "next/link";
type Props = { open: boolean; code?: string; message?: string; required?: string[]; current?: string | null; onClose: () => void; };
export default function UpgradeModal({ open, code, message, required, current, onClose }: Props) {
  if (!open) return null;
  const isAuth = code === "UNAUTHENTICATED";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-bold mb-2">{isAuth ? "Please sign in" : "Upgrade required"}</h3>
        <p className="text-sm text-gray-600 mb-4">{message || (isAuth ? "Sign in to use TMG AI tools." : "Your plan doesn't include this tool.")}</p>
        {!isAuth && required && (<div className="mb-4 text-xs bg-gray-50 p-3 rounded-lg"><div>Current: <b>{current||"none"}</b></div><div>Required: <b>{required.join(" or ")}</b></div></div>)}
        <div className="flex gap-3"><button onClick={onClose} className="flex-1 py-2.5 border rounded-xl">Cancel</button><Link href={isAuth?"/login":"/pricing"} className="flex-1 py-2.5 bg-black text-white rounded-xl text-center">{isAuth?"Sign In":"View Plans"}</Link></div>
      </div>
    </div>
  );
}
