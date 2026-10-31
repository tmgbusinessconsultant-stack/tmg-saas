import Link from "next/link";

const modules = [
  { title: "Website Builder", description: "AI layout generator, SEO, pages, publish — TMG Builder Pro v2 BEST", href: "/builder", badge: "✨ AI BEST", highlight: true },
  { title: "Blog Posts", description: "Write, schedule, publish, and optimize articles.", href: "/admin/content/blog" },
  { title: "Media Library", description: "Upload, scan, organize, preview, and publish media.", href: "/admin/content/media" },
  { title: "Categories", description: "Organize blog articles into public categories.", href: "/admin/content/categories" },
  { title: "SEO Settings", description: "Set site-wide search and social sharing metadata + OG + JSON-LD", href: "/admin/content/seo" },
  { title: "Homepage Content", description: "Edit the homepage hero, services, testimonials, and calls to action.", href: "/admin/content/homepage" },
  { title: "Shop Products", description: "Add, edit, approve, delete Excel templates — Final V3 BEST MATCHED, compressed images, active filter", href: "/admin/content/shop", badge: "BEST" },
  { title: "Website Gallery", description: "Manage public portfolio images and their display order.", href: "/admin/content/gallery" },
  { title: "AI Analytics", description: "View AI conversations, search analytics, and fallback logs — V7-OMNI", href: "/admin/ai/analytics", badge: "NEW" },
];

export default function ContentManagementPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Administration — TMG Engine v2 BEST</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Content Management</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Manage public website content, AI builder, shop, and media — schemaVersion 2, SEO OG + JSON-LD, compressed images.</p>
        </div>
        <Link href="/admin" className="rounded-xl border border-slate-300 px-5 py-2.5 font-bold hover:bg-slate-50">Admin dashboard</Link>
      </div>
      <nav aria-label="Content management modules" className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((item: any) => (
          <Link key={item.href} href={item.href} className={`rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md relative ${item.highlight ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-white ring-1 ring-blue-100' : 'border-slate-200'}`}>
            {item.badge && <span className={`absolute top-4 right-4 text-[10px] font-black px-2.5 py-1 rounded-full ${item.highlight ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>{item.badge}</span>}
            <h2 className="text-xl font-black tracking-tight">{item.title}</h2>
            <p className="mt-2 leading-6 text-slate-600 text-sm">{item.description}</p>
            <span className="mt-5 inline-block font-bold text-[#8A6A00] text-sm">Manage <span aria-hidden="true">→</span></span>
          </Link>
        ))}
      </nav>
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          🔒 Uploaded media is private while malware scan pending. Only clean media explicitly assigned is served publicly.
        </p>
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          ✅ BEST Upgrade active: Shop images auto-compressed ~150KB, active filter, bestseller sort, AI Builder v2 with OG + JSON-LD, schemaVersion 2.
        </p>
      </div>
    </main>
  );
}