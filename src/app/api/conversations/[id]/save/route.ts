import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ConversationModel from '@/models/Conversation';

function getUserId(req: NextRequest): string {
  return req.headers.get('x-user-id') || 'anonymous';
}

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await dbConnect();
    const { id } = await params;
    const userId = getUserId(req);
    const body = await req.json();

    const conversation = await ConversationModel.findOne({ _id: id, userId });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (body.messages && Array.isArray(body.messages)) {
      conversation.messages.push(...body.messages);
    }
    if (body.title) {
      conversation.title = body.title;
    }
    if (body.temperature !== undefined) conversation.temperature = body.temperature;
    if (body.maxTokens !== undefined) conversation.maxTokens = body.maxTokens;
    if (body.systemPrompt !== undefined) conversation.systemPrompt = body.systemPrompt;
    if (body.modelName !== undefined) conversation.modelName = body.modelName;

    await conversation.save();
    return NextResponse.json(conversation);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
