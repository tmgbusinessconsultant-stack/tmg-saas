import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const API_BASE = BACKEND_URL.endsWith('/api') ? BACKEND_URL : BACKEND_URL + '/api';

export async function POST(req: NextRequest, { params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!['login', 'register', 'logout', 'me'].includes(mode)) {
    return NextResponse.json({ message: 'Invalid auth mode' }, { status: 400 });
  }
  try {
    const body = await req.text();
    const backendRes = await fetch(API_BASE + '/auth/' + mode, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body || undefined,
    });
    const data = await backendRes.text();
    let json;
    try { json = JSON.parse(data); } catch { json = { message: data }; }
    const res = NextResponse.json(json, { status: backendRes.status });
    const setCookie = backendRes.headers.get('set-cookie');
    if (setCookie) {
      res.headers.set('set-cookie', setCookie);
    }
    return res;
  } catch (e) {
    console.error('Auth proxy error:', e);
    return NextResponse.json({ message: 'Could not connect to backend at ' + API_BASE }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  try {
    const backendRes = await fetch(API_BASE + '/auth/' + mode, {
      headers: { Cookie: req.headers.get('cookie') || '' },
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ message: 'Backend unreachable' }, { status: 502 });
  }
}
