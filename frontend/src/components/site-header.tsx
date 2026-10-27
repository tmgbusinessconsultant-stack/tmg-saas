"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const desktopLinks = [
  ["Home", "/"],
  ["Services", "/services"],
  ["CV Builder", "/cv-builder"],
  ["AI Assistant", "/business-assistant"],
  ["Documents", "/documents"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;

const mobileLinks = [
  ["Home", "/"],
  ["Services", "/services"],
  ["CV Builder Pro", "/cv-builder"],
  ["AI Assistant Console", "/business-assistant"],
  ["My Documents Vault", "/documents"],
  ["Pricing Plans", "/pricing"],
  ["About TMG", "/about"],
  ["Contact Us", "/contact"],
  ["Client Portal", "/dashboard"],
  ["Get Quote", "/quote"],
] as const;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem("accessToken") || localStorage.getItem("token")) : null;
    setIsAdmin(!!token);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const firstLink = menuRef.current?.querySelector<HTMLElement>("a");
    firstLink?.focus();
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/10 transition-all duration-300 ${scrolled ? "shadow-xl" : "shadow-md"}`}
      style={{ background: "#0F172A" }}
    >
      <div className="mx-auto flex items-center justify-between gap-4 px-4 py-3.5" style={{ maxWidth: "1280px" }}>
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src="/logo.png" alt="TMG Business Consulting Logo" width={140} height={40} className="h-8 w-auto rounded bg-white px-1.5 py-0.5 shadow-sm" priority />
          <span className="hidden text-[14px] font-black md:inline tracking-tight text-white">
            TMG <span className="text-[#D4AF37]">Business Consulting</span>
          </span>
        </Link>

        {/* FIXED: Desktop nav - readable */}
        <nav aria-label="Main navigation" className="hidden items-center gap-1.5 text-[13px] lg:flex font-semibold">
          {desktopLinks.map(([label, href]) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-3.5 py-2 transition-all duration-200 border ${active
                    ? "bg-white text-[#0F172A] border-white shadow-sm"
                    : "bg-slate-100 text-[#0F172A] border-slate-200 hover:bg-white hover:shadow-sm"
                  }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/dashboard" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0F172A] hover:bg-slate-100 shadow-sm border border-slate-200">
            Client Portal
          </Link>
          <Link href="/quote" className="rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-black text-black hover:bg-[#C9A227] shadow-sm">
            Get Quote
          </Link>
          {isAdmin && (
            <Link href="/admin" className="rounded-full border border-white/30 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/20">
              Admin
            </Link>
          )}
        </div>

        <button
          ref={triggerRef}
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/30 text-white lg:hidden hover:bg-white/10"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((c) => !c)}
        >
          <span className="text-xl font-bold">{open ? "×" : "☰"}</span>
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "visible" : "invisible pointer-events-none"}`}>
        <button className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <div ref={menuRef} className={`absolute inset-y-0 right-0 flex w-[min(22rem,85vw)] flex-col bg-[#0F172A] p-6 shadow-2xl transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between border-b border-white/15 pb-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</span>
            <button className="h-11 w-11 rounded-xl text-2xl text-white hover:bg-white/10" onClick={() => setOpen(false)}>×</button>
          </div>
          <nav className="mt-5 flex flex-col gap-2">
            {mobileLinks.map(([label, href]) => {
              const isQuote = href === "/quote";
              const active = isActive(href);
              return (
                <Link key={href} href={href} onClick={() => setOpen(false)} className={`rounded-xl px-4 py-3 text-sm font-semibold ${isQuote ? "bg-[#D4AF37] text-black font-black text-center" : active ? "bg-white text-black" : "bg-slate-100 text-black hover:bg-white"}`}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}