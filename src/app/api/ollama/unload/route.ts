import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.model) {
      return NextResponse.json({ error: 'model is required' }, { status: 400 });
    }
    const res = await fetch(
      `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/unload`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: body.model }),
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to unload model' }, { status: 502 });
    }
    return NextResponse.json({ status: 'unloaded', model: body.model });
  } catch {
    return NextResponse.json({ error: 'Ollama unreachable' }, { status: 503 });
  }
}
