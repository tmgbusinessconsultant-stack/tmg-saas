"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["Home", "/"],
  ["Services", "/services"],
  ["Shop", "/shop"],
  ["CV Builder", "/cv-builder"],
  ["AI Assistant", "/business-assistant"],
  ["Documents", "/documents"],
  ["Pricing", "/pricing"],
  ["My Websites", "/sites"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;

export default function DesktopNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="hidden items-center gap-1.5 text-[13px] lg:flex font-semibold">
      {links.map(([label, href]) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        const isShop = href === "/shop";
        const isWebsites = href === "/sites";
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-full px-3.5 py-2 transition-all duration-200 border ${
              active
                ? "bg-white text-[#0F172A] border-white shadow-sm"
                : isWebsites
                  ? "bg-white text-[#0F172A] border-white shadow-sm font-bold"
                  : isShop
                    ? "bg-[#D4AF37] text-black border-[#D4AF37] hover:bg-[#C9A227] font-black"
                    : "bg-slate-100 text-[#0F172A] border-slate-200 hover:bg-white hover:shadow-sm"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
