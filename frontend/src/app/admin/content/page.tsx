import Link from "next/link";

const modules = [
  { title: "Blog Posts", description: "Write, schedule, publish, and optimize articles.", href: "/admin/content/blog" },
  { title: "Media Library", description: "Upload, scan, organize, preview, and publish media.", href: "/admin/content/media" },
  { title: "Categories", description: "Organize blog articles into public categories.", href: "/admin/content/categories" },
  { title: "SEO Settings", description: "Set site-wide search and social sharing metadata.", href: "/admin/content/seo" },
  { title: "Homepage Content", description: "Edit the homepage hero, services, testimonials, and calls to action.", href: "/admin/content/homepage" },
  { title: "Website Gallery", description: "Manage public portfolio images and their display order.", href: "/admin/content/gallery" },
];

export default function ContentManagementPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Administration</p>
          <h1 className="mt-2 text-4xl font-bold">Content Management</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Manage public website content separately from private client-project deliverables.</p>
        </div>
        <Link href="/admin" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Admin dashboard</Link>
      </div>
      <nav aria-label="Content management modules" className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <h2 className="text-xl font-bold">{item.title}</h2>
            <p className="mt-2 leading-6 text-slate-600">{item.description}</p>
            <span className="mt-5 inline-block font-semibold text-[#8A6A00]">Manage <span aria-hidden="true">→</span></span>
          </Link>
        ))}
      </nav>
      <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Uploaded media is private while the malware scan is pending. Only clean media explicitly assigned a publishing location is served publicly.
      </p>
    </main>
  );
}
