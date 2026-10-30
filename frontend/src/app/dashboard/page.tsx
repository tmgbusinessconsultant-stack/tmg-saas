"use client";
export const dynamic = 'force-dynamic';
import { Suspense } from "react";
import DashboardInner from "./dashboard-inner";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading dashboard...</div>}>
      <DashboardInner />
    </Suspense>
  );
}
