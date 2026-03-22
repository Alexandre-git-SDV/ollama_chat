import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(
      `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/tags`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      const version = data.version || null;
      return NextResponse.json({ ollama: true, version });
    }
    return NextResponse.json({ ollama: false, version: null }, { status: 503 });
  } catch {
    return NextResponse.json({ ollama: false, version: null }, { status: 503 });
  }
}
