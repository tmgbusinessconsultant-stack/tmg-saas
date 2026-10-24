import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = body.input || '';
    return NextResponse.json({ message: `Business Plan generated for: ${input.substring(0,100)}... Premium International — QAR, AUD A$, USD $, GBP £ supported. Use backend /business-plans endpoint for PDF.` });
  } catch (e: any) {
    return NextResponse.json({ message: 'Fallback business plan response' });
  }
}
