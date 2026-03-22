import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(
      `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/version`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ version: data.version });
    }
    return NextResponse.json({ version: null }, { status: 503 });
  } catch {
    return NextResponse.json({ version: null }, { status: 503 });
  }
}
