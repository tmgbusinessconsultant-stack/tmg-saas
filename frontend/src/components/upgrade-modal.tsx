"use client";
import { useState } from "react";
import PayPalSubscribe from "./PayPalSubscribe";

export default function UpgradeModal({ isOpen, onClose, plan }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold">Upgrade to {plan?.name || "Pro"}</h2>
        <p className="mt-2 text-sm text-gray-600">Get advanced AI features</p>
        <div className="mt-6">
          <PayPalSubscribe planId={plan?.paypalPlanId || "P-TEST"} onSuccess={() => { alert("Subscribed!"); onClose(); }} />
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 border rounded">Cancel</button>
      </div>
    </div>
  );
}
