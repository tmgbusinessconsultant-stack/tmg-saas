import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiBase } from '@/lib/backend-api';

export async function POST(req: NextRequest, { params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!['login', 'register', 'logout', 'me'].includes(mode)) {
    return NextResponse.json({ message: 'Invalid auth mode' }, { status: 400 });
  }
  try {
    const body = await req.text();
    const backendRes = await fetch(getBackendApiBase() + '/auth/' + mode, {
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
    return NextResponse.json({ message: 'Could not connect to the account service.' }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  try {
    const authorization = req.headers.get('authorization');
    const backendRes = await fetch(getBackendApiBase() + '/auth/' + mode, {
      headers: {
        Cookie: req.headers.get('cookie') || '',
        ...(authorization ? { Authorization: authorization } : {}),
      },
      cache: 'no-store',
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ message: 'Backend unreachable' }, { status: 502 });
  }
}
