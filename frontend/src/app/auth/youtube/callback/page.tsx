"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
export default function YoutubeCallback() {
  const params = useSearchParams();
  const [msg, setMsg] = useState('Connecting...');
  useEffect(() => {
    const code = params.get('code');
    if (!code) { setMsg('No code returned from Google.'); return; }
    const isLocal = window.location.hostname === 'localhost';
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    fetch(`${api}/auth/youtube/exchange`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, local: isLocal }) })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setMsg('Error: ' + (d.error_description || d.error)); return; }
        localStorage.setItem('youtube_access_token', d.access_token);
        if (d.refresh_token) localStorage.setItem('youtube_refresh_token', d.refresh_token);
        setMsg('Connected! You can now upload videos. Token saved.');
      })
      .catch(() => setMsg('Failed to exchange code.'));
  }, [params]);
  return (<div style={{ maxWidth: 600, margin: '60px auto', padding: 24, fontFamily: 'sans-serif' }}><h1>YouTube Callback</h1><p>{msg}</p><a href="/auth/youtube">Back</a></div>);
}
