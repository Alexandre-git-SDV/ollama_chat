import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ConversationModel from '@/models/Conversation';

function getUserId(req: NextRequest): string {
  return req.headers.get('x-user-id') || 'anonymous';
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    await dbConnect();
    const { id } = await params;
    const userId = getUserId(req);

    const conversation = await ConversationModel
      .findOne({ _id: id, userId })
      .lean();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    await dbConnect();
    const { id } = await params;
    const userId = getUserId(req);
    const body = await req.json();

    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.modelName !== undefined) updateData.modelName = body.modelName;
    if (body.messages !== undefined) updateData.messages = body.messages;
    if (body.temperature !== undefined) updateData.temperature = body.temperature;
    if (body.maxTokens !== undefined) updateData.maxTokens = body.maxTokens;
    if (body.systemPrompt !== undefined) updateData.systemPrompt = body.systemPrompt;
    if (body.seed !== undefined) updateData.seed = body.seed;

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

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    await dbConnect();
    const { id } = await params;
    const userId = getUserId(req);

    const result = await ConversationModel.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
