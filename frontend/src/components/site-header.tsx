import Image from "next/image";
import Link from "next/link";
import DesktopNavigation from "./desktop-navigation";
import MobileNavigation from "./mobile-navigation";
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 shadow-md" style={{ background: "#0F172A" }}>
      <div className="mx-auto flex items-center justify-between gap-4 px-4 py-3.5" style={{ maxWidth: "1280px" }}>
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src="/logo.png" alt="TMG Business Consulting Logo" width={140} height={40} className="h-8 w-auto rounded bg-white px-1.5 py-0.5 shadow-sm" priority />
          <span className="hidden text-[14px] font-black md:inline tracking-tight text-white">TMG <span className="text-[#D4AF37]">Business Consulting</span></span>
        </Link>
        <DesktopNavigation />
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/quote" className="rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-black text-black hover:bg-[#C9A227] shadow-sm">Get Quote</Link>
        </div>
        <MobileNavigation />
      </div>
    </header>
  );
}
