import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, model, temperature, maxTokens, systemPrompt } = await req.json();

  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  const ollamaMessages = [];

  if (systemPrompt) {
    ollamaMessages.push({ role: 'system', content: systemPrompt });
  }

  ollamaMessages.push(
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }))
  );

  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || process.env.DEFAULT_MODEL || 'llama3.2',
      messages: ollamaMessages,
      stream: true,
      options: {
        temperature: temperature ?? 0.7,
        num_predict: maxTokens ?? 2048,
      },
    }),
  });

  if (!response.ok || !response.body) {
    return new Response(
      JSON.stringify({ error: 'Ollama unreachable', status: response.status }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({ content: parsed.message.content, done: parsed.done })}\n\n`
                  )
                );
              }
              if (parsed.done) {
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({ content: '', done: true, total_duration: parsed.total_duration, eval_count: parsed.eval_count })}\n\n`
                  )
                );
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      } catch (err) {
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}