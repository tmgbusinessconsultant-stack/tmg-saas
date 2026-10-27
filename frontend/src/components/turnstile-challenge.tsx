import { Turnstile } from '@marsidev/react-turnstile';
export default function TurnstileChallenge({ onVerify }: { onVerify: (token: string) => void }) {
  return <Turnstile sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAA'} onSuccess={onVerify} />;
}
