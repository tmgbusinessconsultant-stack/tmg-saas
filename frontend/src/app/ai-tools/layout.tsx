"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import UpgradeModal from "@/components/upgrade-modal";

type PaywallState = { open:boolean, code?:string, message?:string, required?:string[], current?:string|null };

const PaywallContext = createContext<{ showPaywall: (data: any) => void } | null>(null);

export function usePaywallLayout() {
  const ctx = useContext(PaywallContext);
  if (!ctx) throw new Error("usePaywallLayout outside provider");
  return ctx;
}

export default function AiToolsLayout({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<PaywallState>({open:false});

  const showPaywall = (data: any) => {
    setModal({ open: true, code: data.code, message: data.message, required: data.required, current: data.current });
  };

  // Intercept fetch responses globally for /api/ai/*
  if (typeof window !== "undefined") {
    const origFetch = window.fetch;
    // @ts-ignore - patch once
    if (!(window as any).__tmgPatched) {
      (window as any).__tmgPatched = true;
      window.fetch = async (...args: any[]) => {
        const res: Response = await (origFetch as any)(...args);
        const url = args[0]?.toString() || "";
        if (url.includes("/api/ai/") && (res.status === 401 || res.status === 403)) {
          try {
            const data = await res.clone().json();
            showPaywall(data);
          } catch {}
        }
        return res;
      };
    }
  }

  return (
    <PaywallContext.Provider value={{ showPaywall }}>
      {children}
      <UpgradeModal open={modal.open} code={modal.code} message={modal.message} required={modal.required} current={modal.current} onClose={()=>setModal({open:false})} />
    </PaywallContext.Provider>
  );
}
