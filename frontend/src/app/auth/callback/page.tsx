"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const token = params.get("token");
    const userStr = params.get("user");
    const error = params.get("error");
    if (error) { router.push("/login?error=" + error); return; }
    if (token) {
      try {
        localStorage.setItem("token", token);
        localStorage.setItem("accessToken", token);
        if (userStr) localStorage.setItem("user", decodeURIComponent(userStr));
        window.dispatchEvent(new Event("tmg-auth-changed"));
      } catch {}
      router.push("/dashboard");
    } else {
      router.push("/login?error=facebook_failed");
    }
  }, [params, router]);
  return <div style={{padding:40,textAlign:"center"}}><h2>Signing you in with Facebook...</h2><p>Please wait...</p></div>;
}
export default function AuthCallbackPage() {
  return <Suspense><CallbackInner /></Suspense>;
}
