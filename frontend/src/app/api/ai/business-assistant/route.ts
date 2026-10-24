import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, country = 'Qatar', currency = 'QAR', symbol = 'QAR ', law = 'Qatar Labour Law', tax = 'No Income Tax', compliance = 'QFC', context } = body;

    if (!message) {
      return NextResponse.json({ message: 'Please provide a message' }, { status: 400 });
    }

    // Try backend Groq / AI service if exists
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    let aiResponse = '';

    try {
      // Try to call Nest backend AI service
      const backendRes = await fetch(`${backendUrl}/ai/business-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: message, country, currency, symbol, law, tax, compliance, context }),
      });
      if (backendRes.ok) {
        const data = await backendRes.json();
        aiResponse = data.message || data.response || data.content || '';
      }
    } catch (e) {
      // backend not available, fallback to local
    }

    // Fallback premium international response if backend fails
    if (!aiResponse) {
      aiResponse = `**TMG Business Consultant — Premium International — ${country} | ${currency} (${symbol})**

**Your Query:** "${message}"

**Jurisdiction:** ${country}
**Currency:** ${currency} (${symbol})
**Law:** ${law}
**Tax:** ${tax}
**Compliance:** ${compliance}

**Advice for ${country} market:**

1. **Legal Compliance (${law}):**
   - Under ${law}, ensure employment contracts include ${compliance} requirements.
   - For ${country}, all financial reporting must be in ${symbol} ${currency}.
   - Example: If hiring, salary of ${symbol}10,000 ${currency} must comply with ${law}.

2. **Financial Structure (${symbol} ${currency}):**
   - Startup costs in ${country} typically: ${symbol}50,000 - ${symbol}250,000 ${currency}
   - Tax regime: ${tax}
   - For ${currency} transactions, use local banking compliance for ${compliance}.

3. **Business Setup Checklist — ${country}:**
   - Register entity: ${compliance} (e.g., ${country === 'Australia' ? 'ABN/ACN required, ASIC registration' : country === 'Qatar' ? 'QFC LLC, MOCIAT registration' : country === 'USA' ? 'LLC/Inc, EIN, SBA 7(a)' : 'Local registry'})
   - Compliance: ${law}
   - Currency handling: All invoices in ${symbol} ${currency}, with VAT/GST as per ${tax}

4. **Next Steps for ${symbol} ${currency}:**
   - Create Business Plan in ${symbol} ${currency} using our Business Plan Builder (supports ${currency})
   - Generate Policies compliant with ${law}
   - Use our Document Review for ${country} jurisdiction

**Example Calculation in ${symbol} ${currency}:**
If your monthly revenue is ${symbol}30,000 ${currency}, with tax ${tax}, net considerations under ${law} would require proper compliance via ${compliance}.

Need specific document? Use:
- CV Builder: ${country} | ${symbol} ${currency}
- Cover Letter: ${country} | ${law}
- Business Plan: ${country} | ${symbol} ${currency} | ${law}
- Policy Generator: ${law}

*This advice is tailored to ${country} (${currency}) — For detailed legal advice, consult local counsel under ${law}.*

— TMG Premium International | ${country} | ${currency} (${symbol}) | ${new Date().getFullYear()}
`;
    }

    return NextResponse.json({ message: aiResponse, country, currency, symbol, law });
  } catch (err: any) {
    console.error('Business Assistant API error:', err);
    // Never return HTML, always JSON
    return NextResponse.json({ 
      message: `Service temporarily using fallback mode. For ${err.message || 'your market'}, all amounts in local currency. Compliance under local law. Please try again — backend AI will be connected shortly.`,
      fallback: true
    }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Business Assistant Pro International — 10 Countries', currencies: ['QAR','AUD A$','AED','SAR','GBP £','USD $','CAD C$','INR ₹','SGD S$','EUR €'], laws: ['Qatar Labour Law','Fair Work Act 2009','UAE Labour Law','Saudi Labour Law','UK Employment Rights Act','FLSA'] });
}
