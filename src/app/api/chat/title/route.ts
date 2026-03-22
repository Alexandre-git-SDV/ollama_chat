import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const systemPrompt =
      'Tu es un assistant qui génère des titres courts (max 5 mots) pour des conversations de chat. Réponds uniquement avec le titre, sans ponctuation ni guillemets.';

    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user');

    const titleMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(0, 2),
    ];

    if (lastUserMessage) {
      titleMessages.push({
        role: 'user',
        content: `Génère un titre court (max 5 mots) pour cette conversation: "${lastUserMessage.content.slice(0, 100)}"`,
      });
    }

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || process.env.DEFAULT_MODEL || 'llama3.2',
        messages: titleMessages,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 30,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to generate title' }, { status: 502 });
    }

    const data = await response.json();
    const rawTitle = data.message?.content?.trim() || '';

    const title = rawTitle
      .replace(/^["']|["']$/g, '')
      .replace(/^(Conversation|Sujet|Titre|Titre de la conversation)\s*[:\-]?\s*/i, '')
      .slice(0, 60);

    return NextResponse.json({ title: title || 'Nouvelle conversation' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
