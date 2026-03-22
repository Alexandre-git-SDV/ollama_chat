import { NextResponse } from 'next/server';
import ollamaClient from '@/lib/ollama';

export async function GET() {
  try {
    const response = await fetch(
      `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/tags`
    );

    if (response.ok) {
      return NextResponse.json({ ollama: true });
    }

    return NextResponse.json({ ollama: false }, { status: 503 });
  } catch {
    return NextResponse.json({ ollama: false }, { status: 503 });
  }
}