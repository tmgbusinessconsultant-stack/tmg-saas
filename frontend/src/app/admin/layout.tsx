"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/content-management";

type AdminIdentity = { role: string };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return () => { active = false; };
    }

    void apiRequest<AdminIdentity>("/auth/me", token)
      .then((identity) => {
        const staffRoles = ["SUPER_ADMIN", "ADMIN_MANAGER", "CONTENT_MANAGER", "FINANCE_MANAGER", "PROJECT_MANAGER", "STAFF", "ADMIN"];
        if (!staffRoles.includes(identity.role)) throw new Error("Administrator access is required.");
        const superAdminOnly = pathname.startsWith("/admin/content") || pathname === "/admin/users" || pathname === "/admin/activity";
        if (superAdminOnly && identity.role !== "SUPER_ADMIN") {
          router.replace("/admin");
          return;
        }
        if (active) setAuthorized(true);
      })
      .catch(() => {
        if (active) {
          sessionStorage.removeItem("accessToken");
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
      });

    return () => { active = false; };
  }, [pathname, router]);

  if (!authorized) {
    return <main className="mx-auto max-w-3xl px-6 py-16" role="status">Checking administrator access…</main>;
  }
  return children;
}
