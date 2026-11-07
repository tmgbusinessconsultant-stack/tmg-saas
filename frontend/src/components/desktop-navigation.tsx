"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [["Home","/"],["AI Tools","/ai-tools"],["Services","/services"],["Pricing","/pricing"],["My Websites","/sites"],["Contact","/contact"]] as const;
export default function DesktopNavigation() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1.5 text-[13px] lg:flex font-semibold">
      {links.map(([label, href]) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return <Link key={href} href={href} className={`rounded-full px-3.5 py-2 border ${active ? "bg-white text-[#0F172A] border-white shadow-sm" : "bg-slate-100 text-[#0F172A] border-slate-200 hover:bg-white"}`}>{label}</Link>;
      })}
      <Link href="/securefind" className="ml-1 rounded-full bg-[#D4AF37] px-4 py-2 font-black text-black">🔍 SecureFind</Link>
      <Link href="/shop" className="ml-1 rounded-full bg-[#D4AF37] px-4 py-2 font-black text-black">Shop</Link>
    </nav>
  );
}
