"use client";
import PayPalSubscribe from "./PayPalSubscribe";

type UpgradePlan = { name?: string; paypalPlanId?: string };

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  plan?: UpgradePlan | null;
};

export default function UpgradeModal({ isOpen, onClose, plan }: UpgradeModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold">Upgrade to {plan?.name || "Pro"}</h2>
        <p className="mt-2 text-sm text-gray-600">Get advanced AI features</p>
        <div className="mt-6">
          {plan?.paypalPlanId
            ? <PayPalSubscribe planId={plan.paypalPlanId} onSuccess={() => { alert("Subscription verified."); onClose(); }} />
            : <p role="status" className="text-sm text-red-600">PayPal is not configured for this plan.</p>}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 border rounded">Cancel</button>
      </div>
    </div>
  );
}
