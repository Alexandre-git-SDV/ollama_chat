import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/version`
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ version: data.version });
    }

    return NextResponse.json({ version: null }, { status: 503 });
  } catch {
    return NextResponse.json({ version: null }, { status: 503 });
  }
}