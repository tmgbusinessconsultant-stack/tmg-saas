import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-4xl font-black">404 - Page not found</h1>
      <p className="mt-4 text-zinc-500">The page you are looking for does not exist.</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-[#0F172A] px-6 py-3 text-sm font-bold text-white">Go home</Link>
    </main>
  );
}

