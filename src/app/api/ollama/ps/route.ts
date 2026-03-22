import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(
      `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/ps`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch running models' }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({ models: data.models || [] });
  } catch {
    return NextResponse.json({ error: 'Ollama unreachable' }, { status: 503 });
  }
}
