export default function TiktokPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const href = `${api}/auth/tiktok?local=${isLocal ? '1' : '0'}`;
  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Connect TikTok</h1>
      <p>Connect your TMG TikTok @tmgbusinessconsultant to upload videos.</p>
      <a href={href} style={{ display: 'inline-block', background: '#000', color: '#fff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>Connect TikTok</a>
      <p style={{ marginTop: 16, fontSize: 13, color: '#666' }}>You will be redirected to TikTok, then back here.</p>
    </div>
  );
}
