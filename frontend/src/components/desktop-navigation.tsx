"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [["Home","/"],["Services","/services"],["AI Tools","/ai-tools"],["Pricing","/pricing"],["Contact","/contact"]] as const;
export default function DesktopNavigation() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1.5 text-[13px] lg:flex font-semibold">
      {links.map(([label, href]) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return <Link key={href} href={href} className={`rounded-full px-3.5 py-2 border ${active ? "bg-white text-[#0F172A] border-white shadow-sm" : "bg-slate-100 text-[#0F172A] border-slate-200 hover:bg-white"}`}>{label}</Link>;
      })}
    </nav>
  );
}
