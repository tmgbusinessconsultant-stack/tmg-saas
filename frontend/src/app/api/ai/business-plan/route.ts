export async function POST(req: Request) {
  try {
    const { messages, data } = await req.json();
    const defaultSystemPrompt = 'You are TMG Business Plan Generator. Create practical, investor-ready business plans for startups and SMEs in Qatar and beyond.';
    const systemPrompt = typeof data?.systemPrompt === 'string' && data.systemPrompt.trim()
      ? data.systemPrompt
      : defaultSystemPrompt;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ message: 'Missing GROQ_API_KEY environment variable' });
    }

    const payloadMessages = Array.isArray(messages) && messages.length > 0
      ? messages
      : [{ role: 'user', content: typeof data === 'string' ? data : JSON.stringify(data ?? {}) }];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        messages: [{ role: 'system', content: systemPrompt }, ...payloadMessages],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      return Response.json({ message: 'Groq Error: ' + JSON.stringify(result) });
    }

    return Response.json({ message: result.choices?.[0]?.message?.content ?? 'No response generated.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return Response.json({ message: `Server Error: ${message}` }, { status: 500 });
  }
}
