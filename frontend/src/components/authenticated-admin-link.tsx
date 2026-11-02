"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getToken() {
  return sessionStorage.getItem("accessToken")
    || localStorage.getItem("accessToken")
    || localStorage.getItem("token")
    || localStorage.getItem("access_token")
    || localStorage.getItem("authToken");
}

export default function AuthenticatedAdminLink() {
  usePathname();
  const token = useSyncExternalStore(subscribe, getToken, () => null);

  if (!token) return null;
  return (
    <Link href="/admin" className="rounded-full border border-white/30 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/20">
      Admin
    </Link>
  );
}
