"use client";
import { useState, ReactNode } from "react";
import UpgradeModal from "@/components/upgrade-modal";

type PaywallState = { open:boolean, code?:string, message?:string, required?:string[], current?:string|null };

export default function AiToolsLayout({ children }: { children: ReactNode }) {
  const [modal] = useState<PaywallState>({open:false});
  return (
    <>
      {children}
      <UpgradeModal open={modal.open} code={modal.code} message={modal.message} required={modal.required} current={modal.current} onClose={()=>{}} />
    </>
  );
}
