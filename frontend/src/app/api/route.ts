export async function POST(req: Request) {
    try {
        const { messages } = await req.json()
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "You are TMG Business Consultant AI, expert in Qatar business setup, company formation, PRO services, and visas. Be helpful and concise."
                    },
                    ...messages
                ],
                model: 'openai/gpt-oss-20b',
                temperature: 0.7,
            }),
        })
        const data = await response.json()
        if (!response.ok) {
            return Response.json({ message: `Groq Error: ${JSON.stringify(data)}` })
        }
        return Response.json({ message: data.choices[0].message.content })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unexpected server error.";
        return Response.json({ message: `Server Error: ${message}` }, { status: 500 })
    }
}