import { NextRequest, NextResponse } from "next/server";
import { getBackendApiBase } from "@/lib/backend-api";
import { requireAuthenticated } from "@/lib/auth-guard";

type AssistantMessage = { role: "user" | "assistant"; content: string };

function isAssistantMessage(value: unknown): value is AssistantMessage {
  if (typeof value !== "object" || value === null) return false;
  return "role" in value
    && (value.role === "user" || value.role === "assistant")
    && "content" in value
    && typeof value.content === "string";
}

export async function POST(req: NextRequest) {
  const guard = await requireAuthenticated(req);
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("messages" in body) || !Array.isArray(body.messages)) {
    return NextResponse.json({ message: "Provide a conversation message history." }, { status: 400 });
  }
  if (!("turnstileToken" in body) || typeof body.turnstileToken !== "string" || !body.turnstileToken) {
    return NextResponse.json({ message: "Complete bot verification before sending your question." }, { status: 400 });
  }

  const messages = body.messages.filter(isAssistantMessage);
  if (messages.length === 0 || messages.length > 20 || messages.at(-1)?.role !== "user") {
    return NextResponse.json({ message: "Send 1–20 messages and end with your question." }, { status: 400 });
  }
  if (messages.some((message) => message.content.length === 0 || message.content.length > 4000)) {
    return NextResponse.json({ message: "Each message must be between 1 and 4,000 characters." }, { status: 400 });
  }

  const country = "country" in body && typeof body.country === "string" ? body.country : "Qatar";
  const currency = "currency" in body && typeof body.currency === "string" ? body.currency : "QAR";
  const law = "law" in body && typeof body.law === "string" ? body.law : "Qatar Labour Law";
  const tax = "tax" in body && typeof body.tax === "string" ? body.tax : "No Income Tax";
  const lastMessage = messages.at(-1);
  if (lastMessage) {
    lastMessage.content = `Market context: country ${country}; currency ${currency}; relevant law ${law}; tax context ${tax}.\n\n${lastMessage.content}`;
  }

  try {
    const backendResponse = await fetch(`${getBackendApiBase()}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify({ messages, turnstileToken: body.turnstileToken }),
      cache: "no-store",
    });
    const responseText = await backendResponse.text();
    let response: unknown;
    try {
      response = JSON.parse(responseText) as unknown;
    } catch {
      response = { message: "The assistant service returned an invalid response." };
    }

    const result = NextResponse.json(response, { status: backendResponse.status });
    const setCookie = backendResponse.headers.get("set-cookie");
    if (setCookie) result.headers.set("set-cookie", setCookie);
    return result;
  } catch (error) {
    console.error("Business Assistant backend request failed:", error);
    return NextResponse.json(
      { message: "The assistant service is temporarily unavailable." },
      { status: 502 },
    );
  }
}
