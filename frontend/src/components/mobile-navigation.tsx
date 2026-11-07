"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const mobileLinks = [
  ["Home", "/"],
  ["Services", "/services"],
  ["Shop Templates", "/shop"],
  ["🔍 SecureFind - Find Suppliers", "/securefind"],
  ["CV Builder Pro", "/cv-builder"],
  ["AI Assistant Console", "/ai-tools/business-assistant"],
  ["My Documents Vault", "/documents"],
  ["Pricing Plans", "/pricing"],
  ["🌐 My Websites", "/sites"],
  ["About TMG", "/about"],
  ["Contact Us", "/contact"],
  ["Client Portal", "/dashboard"],
  ["Get Quote", "/quote"],
] as const;

export default function MobileNavigation() {
  const pathname = usePathname();
  const [navigation, setNavigation] = useState({ pathname, open: false });
  const open = navigation.pathname === pathname && navigation.open;
  const setOpen = useCallback(
    (nextOpen: boolean) => setNavigation({ pathname, open: nextOpen }),
    [pathname],
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const firstLink = menuRef.current?.querySelector<HTMLElement>("a");
    firstLink?.focus();
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 lg:hidden hover:bg-slate-100 shadow-sm"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="text-xl font-bold">{open ? "×" : "☰"}</span>
      </button>

      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "visible" : "invisible pointer-events-none"}`}>
        <button
          className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
        <div ref={menuRef} className={`absolute inset-y-0 right-0 flex w-[min(22rem,85vw)] flex-col bg-[#0F172A] p-6 shadow-2xl transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between border-b border-white/15 pb-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</span>
            <button type="button" className="h-11 w-11 rounded-xl text-2xl text-white hover:bg-white/10" aria-label="Close navigation" onClick={() => setOpen(false)}>×</button>
          </div>
          <nav aria-label="Mobile navigation" className="mt-5 flex flex-col gap-2">
            {mobileLinks.map(([label, href]) => {
              const isQuote = href === "/quote";
              const isShop = href === "/shop";
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${isQuote ? "bg-[#D4AF37] text-black font-black text-center" : isShop ? "bg-[#D4AF37] text-black font-black" : active ? "bg-white text-black" : "bg-slate-100 text-black hover:bg-white"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}

