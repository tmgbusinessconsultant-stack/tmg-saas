"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
type U = { name?: string; email?: string };
export default function AuthButtons() {
  const [user, setUser] = useState<U | null>(null);
  const router = useRouter();
  useEffect(() => {
    const read = () => { try { const r = localStorage.getItem("user"); setUser(r ? JSON.parse(r) : null); } catch { setUser(null); } };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("tmg-auth-changed", read);
    return () => { window.removeEventListener("storage", read); window.removeEventListener("tmg-auth-changed", read); };
  }, []);
  function signOut() {
    try { localStorage.removeItem("accessToken"); localStorage.removeItem("token"); localStorage.removeItem("refreshToken"); localStorage.removeItem("user"); sessionStorage.removeItem("accessToken"); } catch {}
    setUser(null); window.dispatchEvent(new Event("tmg-auth-changed")); router.push("/"); router.refresh();
  }
  if (!user) {
    return (<>
      <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-white hover:text-[#D4AF37]"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base">👤</span>Sign in</Link>
      <Link href="/quote" className="rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-black text-black hover:bg-[#C9A227]">Get Quote</Link>
    </>);
  }
  const initial = (user.name || user.email || "C").trim().charAt(0).toUpperCase();
  const first = (user.name || user.email || "").split(" ")[0];
  return (<>
    <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-white hover:text-[#D4AF37]"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37] text-sm font-black text-black">{initial}</span>Hi, {first}</Link>
    <Link href="/dashboard" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">My Dashboard</Link>
    <button onClick={signOut} className="text-sm font-semibold text-white/70 hover:text-white">Sign out</button>
  </>);
}
