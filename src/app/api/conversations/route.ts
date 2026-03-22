import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ConversationModel from '@/models/Conversation';

function getUserId(req: NextRequest): string {
  return req.headers.get('x-user-id') || 'anonymous';
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const userId = getUserId(req);
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const skip = parseInt(req.nextUrl.searchParams.get('skip') || '0');

    const conversations = await ConversationModel
      .find({ userId })
      .sort({ updatedAt: -1 })
      .select('_id title modelName temperature maxTokens systemPrompt createdAt updatedAt')
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ConversationModel.countDocuments({ userId });

    return NextResponse.json({ conversations, total });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const userId = getUserId(req);
    const body = await req.json();

    const conversation = new ConversationModel({
      userId,
      title: body.title || 'Nouvelle conversation',
      modelName: body.modelName || body.model || 'llama3.2',
      messages: body.messages || [],
      temperature: body.temperature ?? 0.7,
      maxTokens: body.maxTokens ?? 2048,
      systemPrompt: body.systemPrompt || '',
      seed: body.seed,
    });

    await conversation.save();
    return NextResponse.json(conversation, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
