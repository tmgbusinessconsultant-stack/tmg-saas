"use client"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"

export default function PayPalSubscribe({ planId }) {
  return (
    <PayPalScriptProvider options={{ 
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
      vault: true,
      intent: "subscription"
    }}>
      <PayPalButtons
        style={{ layout: "vertical", color: "blue", shape: "rect", label: "subscribe" }}
        createSubscription={(data, actions) => {
          return actions.subscription.create({
            plan_id: planId
          })
        }}
        onApprove={async (data) => {
          console.log("Subscribed:", data.subscriptionID)
          await fetch("https://tmg-saas.onrender.com/api/paypal/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscriptionID: data.subscriptionID })
          })
        }}
      />
    </PayPalScriptProvider>
  )
}