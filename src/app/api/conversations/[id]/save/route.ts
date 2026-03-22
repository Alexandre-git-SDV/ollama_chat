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

    const updateData: Record<string, unknown> = {};

    if (body.messages && Array.isArray(body.messages)) {
      updateData.messages = body.messages;
    }
    if (body.title !== undefined) updateData.title = body.title;
    if (body.temperature !== undefined) updateData.temperature = body.temperature;
    if (body.maxTokens !== undefined) updateData.maxTokens = body.maxTokens;
    if (body.systemPrompt !== undefined) updateData.systemPrompt = body.systemPrompt;
    if (body.modelName !== undefined) updateData.modelName = body.modelName;

    const conversation = await ConversationModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
