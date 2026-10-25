// src/app/public-projects/page.tsx
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Public Projects | TMG Business Consulting",
  description: "Browse public projects and portfolio by TMG Business Consulting. Redirecting to gallery.",
  alternates: { canonical: "https://tmgbusinessconsulting.com/gallery" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Public Projects | TMG Business Consulting",
    url: "https://tmgbusinessconsulting.com/public-projects",
    type: "website",
    siteName: "TMG Business Consulting",
  },
};

export default function PublicProjectsPage() {
  redirect("/gallery");
}