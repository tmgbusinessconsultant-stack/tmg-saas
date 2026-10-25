import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio | TMG Business Consulting",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://tmgbusinessconsulting.com/gallery" },
};

export default function PortfolioPage() {
  redirect("/gallery");
}