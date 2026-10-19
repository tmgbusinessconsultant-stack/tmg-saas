"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const mobileLinks = [
  ["Home", "/"],
  ["Services", "/services"],
  ["Search Services", "/search"],
  ["Ask TMG AI", "/ai"],
  ["Upload File", "/upload"],
  ["Pricing", "/pricing"],
  ["Contact", "/contact"],
  ["Client Portal", "/dashboard"],
  ["Get Quote", "/quote"],
] as const;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const menu = menuRef.current;
    const firstLink = menu?.querySelector<HTMLElement>("a");
    firstLink?.focus();
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !menu) return;
      const focusable = [...menu.querySelectorAll<HTMLElement>("a, button")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-[#0F172A] text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src="/logo.png" alt="TMG" width={140} height={40} className="h-8 w-auto rounded bg-white px-1" />
          <span className="hidden text-sm font-bold md:inline">TMG <span className="text-[#D4AF37]">Business Consulting</span></span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm text-slate-200 lg:flex">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/services" className="hover:text-white">Services</Link>
          <Link href="/search" className="hover:text-white">Search Services</Link>
          <Link href="/ai" className="hover:text-white">Ask TMG AI</Link>
          <Link href="/upload" className="hover:text-white">Upload File</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/dashboard" className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#0F172A]">Client Portal</Link>
          <Link href="/quote" className="rounded-md bg-[#D4AF37] px-4 py-2 font-semibold text-black">Get Quote</Link>
          <Link href="/admin" className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#0F172A]">Admin</Link>
        </div>
        <button
          ref={triggerRef}
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-white/30 text-white lg:hidden"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((current) => !current)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true" className="text-2xl leading-none">{open ? "×" : "☰"}</span>
        </button>
      </div>
      <div className={`fixed inset-0 z-50 overflow-hidden lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <button
          type="button"
          aria-label="Close navigation menu"
          tabIndex={open ? 0 : -1}
          className={`absolute inset-0 bg-slate-950/60 transition-opacity duration-200 motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        />
        <div
          id="mobile-navigation"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className={`absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col overflow-y-auto bg-[#0F172A] p-6 shadow-2xl transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between border-b border-white/15 pb-5">
            <span className="font-semibold">Navigation</span>
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              aria-label="Close navigation menu"
              className="min-h-11 min-w-11 rounded-md text-2xl hover:bg-white/10"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              ×
            </button>
          </div>
          <nav aria-label="Mobile navigation" className="mt-5 flex flex-col gap-1">
            {mobileLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                tabIndex={open ? 0 : -1}
                className={`rounded-lg px-4 py-3 font-medium hover:bg-white/10 ${href === "/quote" ? "mt-2 bg-[#D4AF37] text-black hover:bg-[#e4c455]" : "text-white"}`}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
