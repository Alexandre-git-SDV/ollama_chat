import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  createdAt: string;
}

export interface IConversation extends Omit<Document, 'model'> {
  userId: string;
  title: string;
  modelName: string;
  messages: IMessage[];
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  seed?: number;
}

const MessageSchema = new Schema<IMessage>(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    model: { type: String },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: 'Nouvelle conversation' },
    modelName: { type: String, required: true },
    messages: { type: [MessageSchema], default: [] },
    temperature: { type: Number, default: 1 },
    maxTokens: { type: Number, default: 2048 },
    systemPrompt: { type: String, default: '' },
    seed: { type: Number },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ userId: 1, updatedAt: -1 });

const ConversationModel: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default ConversationModel;
