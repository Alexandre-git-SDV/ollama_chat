import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(
      `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/show`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: body.model }),
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Ollama unreachable' }, { status: 503 });
  }
}
