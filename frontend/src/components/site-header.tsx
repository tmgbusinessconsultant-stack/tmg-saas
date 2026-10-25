"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const desktopLinks = [
  ["Home", "/"],
  ["Services", "/services"],
  ["Search", "/search"],
  ["Ask AI", "/ai"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;

const mobileLinks = [
  ["Home", "/"],
  ["Services", "/services"],
  ["Search Services", "/search"],
  ["Ask TMG AI", "/ai"],
  ["Upload File", "/upload"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
  ["Contact", "/contact"],
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
    const token = sessionStorage.getItem("accessToken") || localStorage.getItem("token");
    setIsAdmin(!!token);
  }, [pathname]);

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

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header
      className={`sticky top-0 z-50 text-white transition-all duration-300 ${scrolled ? "shadow-lg backdrop-blur-md bg-opacity-95" : "shadow-sm"}`}
      style={{
        background: "var(--header-bg)",
        minHeight: "var(--header-height)",
        borderBottom: `var(--border-width) solid color-mix(in srgb, var(--border-color) 20%, transparent)`,
      }}
    >
      <div className="mx-auto flex items-center justify-between gap-4 px-4 py-4" style={{ maxWidth: "var(--container-max)" }}>
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src="/logo.png" alt="TMG" width={140} height={40} className="h-8 w-auto rounded bg-white px-1.5 py-0.5 shadow-sm" />
          <span className="hidden text-sm font-bold md:inline">
            TMG <span style={{ color: "var(--gold)" }}>Business Consulting</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 text-sm text-slate-200 lg:flex">
          {desktopLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded-md transition font-medium ${isActive(href) ? "bg-white/15 text-white" : "hover:bg-white/10 hover:text-white"}`}
              style={{ borderRadius: "var(--button-radius)" }}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/dashboard" className="px-3 py-2 text-sm font-semibold bg-white text-black hover:bg-slate-100 transition" style={{ borderRadius: "var(--button-radius)", minHeight: "var(--button-height)" }}>
            Client Portal
          </Link>
          <Link href="/quote" className="px-4 py-2 font-bold text-black hover:opacity-90 transition" style={{ background: "var(--gold)", borderRadius: "var(--button-radius)", minHeight: "var(--button-height)" }}>
            Get Quote
          </Link>
          {isAdmin && (
            <Link href="/admin" className="px-3 py-2 text-sm font-semibold border border-white/20 hover:bg-white/10 transition" style={{ borderRadius: "var(--button-radius)" }}>
              Admin
            </Link>
          )}
        </div>

        <button
          ref={triggerRef}
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-white/30 text-white lg:hidden hover:bg-white/10 transition"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((c) => !c)}
          style={{ borderRadius: "var(--button-radius)" }}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true" className="text-2xl leading-none">{open ? "×" : "☰"}</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-50 overflow-hidden lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <button
          type="button"
          aria-label="Close navigation menu"
          tabIndex={open ? 0 : -1}
          className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
        />
        <div
          id="mobile-navigation"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className={`absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col overflow-y-auto p-6 shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
          style={{ background: "var(--header-bg)" }}
        >
          <div className="flex items-center justify-between border-b border-white/15 pb-5">
            <span className="font-semibold">Navigation</span>
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              aria-label="Close navigation menu"
              className="min-h-11 min-w-11 rounded-md text-2xl hover:bg-white/10"
              onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
            >
              ×
            </button>
          </div>
          <nav aria-label="Mobile navigation" className="mt-5 flex flex-col gap-1">
            {mobileLinks.map(([label, href]) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  tabIndex={open ? 0 : -1}
                  className={`rounded-lg px-4 py-3 font-medium transition ${href === "/quote" ? "mt-2 font-bold text-black" : active ? "bg-white/15 text-white" : "text-white hover:bg-white/10"}`}
                  style={{
                    borderRadius: "var(--button-radius)",
                    background: href === "/quote" ? "var(--gold)" : undefined,
                  }}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link href="/admin" tabIndex={open ? 0 : -1} className="mt-2 rounded-lg bg-white/10 px-4 py-3 font-medium text-white" onClick={() => setOpen(false)}>Admin Dashboard</Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
