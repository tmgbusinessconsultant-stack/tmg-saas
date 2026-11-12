"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export default function AuthButtonsMobile({ onNavigate }: { onNavigate: () => void }) {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const router = useRouter();
  useEffect(() => {
    const read = () => { try { const r = localStorage.getItem("user"); setUser(r ? JSON.parse(r) : null); } catch {} };
    read(); window.addEventListener("tmg-auth-changed", read); window.addEventListener("storage", read);
    return () => { window.removeEventListener("tmg-auth-changed", read); window.removeEventListener("storage", read); };
  }, []);
  function signOut() { try { localStorage.removeItem("accessToken"); localStorage.removeItem("token"); localStorage.removeItem("refreshToken"); localStorage.removeItem("user"); sessionStorage.removeItem("accessToken"); } catch {} setUser(null); window.dispatchEvent(new Event("tmg-auth-changed")); onNavigate(); router.push("/"); router.refresh(); }
  if (!user) return (<>
    <Link href="/login" onClick={onNavigate} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-black text-center">👤 Sign in</Link>
    <Link href="/register" onClick={onNavigate} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white text-center">Create account</Link>
  </>);
  return (<>
    <Link href="/dashboard" onClick={onNavigate} className="rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-black text-center">👤 Hi, {(user.name || user.email || "").split(" ")[0]} - My Dashboard</Link>
    <button onClick={signOut} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white">Sign out</button>
  </>);
}
