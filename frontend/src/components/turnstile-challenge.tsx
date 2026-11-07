import { Turnstile } from "@marsidev/react-turnstile";
import { useEffect, useState } from "react";

export default function TurnstileChallenge({ onVerify }: { onVerify: (token: string) => void }) {
  const [isLocal, setIsLocal] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") {
      setIsLocal(true);
      onVerify("dev-bypass-token");
      console.log("Turnstile disabled for localhost dev");
    }
  }, [onVerify]);

  if (isLocal || !siteKey || process.env.NODE_ENV === "development") {
    return null;
  }

  return <Turnstile siteKey={siteKey} onSuccess={onVerify} />;
}
